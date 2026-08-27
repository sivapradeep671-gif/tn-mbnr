// TN-MBNR Centralized Resilient API Client
// Implements timeout, exponential backoff retries, request correlation IDs, idempotency keys, and structured error mapping

import { config } from '../config';
import { networkManager } from '../utils/networkManager';

export interface ApiErrorOptions {
    status: number;
    message: string;
    code?: string;
    details?: unknown;
}

export class ApiError extends Error {
    public status: number;
    public code: string;
    public details: unknown;

    constructor({ status, message, code = 'API_ERROR', details }: ApiErrorOptions) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export interface RequestOptions extends RequestInit {
    timeoutMs?: number;
    maxRetries?: number;
    idempotencyKey?: string;
    skipAuth?: boolean;
}

class ApiClient {
    private baseUrl: string = config.apiUrl;
    private fallbackUrl: string = 'http://127.0.0.1:3001/api';
    private defaultTimeoutMs: number = 8000;

    private getHeaders(customHeaders?: HeadersInit, idempotencyKey?: string): HeadersInit {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Request-ID': `req-${crypto.randomUUID()}`
        };

        const token = typeof localStorage !== 'undefined' ? localStorage.getItem(config.auth.tokenKey) : null;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (idempotencyKey) {
            headers['X-Idempotency-Key'] = idempotencyKey;
        }

        if (customHeaders) {
            Object.assign(headers, customHeaders);
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        if (!response.ok) {
            let errorData: Record<string, unknown> = {};
            if (isJson) {
                errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
            }

            let message = (errorData.error || errorData.message || `HTTP ${response.status} Error`) as string;
            let code = (errorData.code || `HTTP_${response.status}`) as string;

            switch (response.status) {
                case 401:
                    message = (errorData.error as string) || 'Authentication required. Please log in again.';
                    code = 'UNAUTHORIZED';
                    break;
                case 403:
                    message = (errorData.error as string) || 'Access denied. Insufficient permissions.';
                    code = 'FORBIDDEN';
                    break;
                case 404:
                    message = (errorData.error as string) || 'Requested resource not found.';
                    code = 'NOT_FOUND';
                    break;
                case 409:
                    message = (errorData.error as string) || 'Conflict detected. Duplicate entry or state mismatch.';
                    code = 'CONFLICT';
                    break;
                case 422:
                    message = (errorData.error as string) || 'Validation failed for request data.';
                    code = 'UNPROCESSABLE_ENTITY';
                    break;
                case 429:
                    message = (errorData.error as string) || 'Too many requests. Please wait before retrying.';
                    code = 'TOO_MANY_REQUESTS';
                    break;
                case 500:
                    message = (errorData.error as string) || 'Internal server error occurred.';
                    code = 'INTERNAL_SERVER_ERROR';
                    break;
                case 502:
                case 503:
                case 504:
                    message = (errorData.error as string) || 'Service temporarily unavailable. Operating in offline mode.';
                    code = 'SERVICE_UNAVAILABLE';
                    break;
            }

            throw new ApiError({
                status: response.status,
                message,
                code,
                details: errorData
            });
        }

        if (!isJson) {
            throw new ApiError({
                status: response.status,
                message: 'Invalid API response format: Expected JSON.',
                code: 'INVALID_RESPONSE_FORMAT'
            });
        }

        return response.json();
    }

    private async executeFetch<T>(url: string, options: RequestInit, timeoutMs: number): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return await this.handleResponse<T>(response);
        } catch (err: unknown) {
            clearTimeout(timeoutId);
            if (err instanceof Error && err.name === 'AbortError') {
                throw new ApiError({
                    status: 408,
                    message: `Request timed out after ${timeoutMs}ms.`,
                    code: 'TIMEOUT'
                });
            }
            throw err;
        }
    }

    private async requestWithRetry<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        const {
            timeoutMs = this.defaultTimeoutMs,
            maxRetries = 2,
            idempotencyKey,
            ...fetchOptions
        } = options;

        const method = (fetchOptions.method || 'GET').toUpperCase();
        const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);
        const headers = this.getHeaders(fetchOptions.headers, idempotencyKey);

        const primaryUrl = `${this.baseUrl}${endpoint}`;
        const fallbackUrl = `${this.fallbackUrl}${endpoint}`;

        let attempt = 0;
        let lastError: unknown = null;

        while (attempt <= (isSafeMethod ? maxRetries : 0)) {
            try {
                return await this.executeFetch<T>(primaryUrl, { ...fetchOptions, headers }, timeoutMs);
            } catch (primaryErr: unknown) {
                lastError = primaryErr;

                if (primaryErr instanceof ApiError && primaryErr.status >= 400 && primaryErr.status < 500 && primaryErr.status !== 429) {
                    throw primaryErr;
                }

                if (!primaryUrl.startsWith(this.fallbackUrl)) {
                    try {
                        return await this.executeFetch<T>(fallbackUrl, { ...fetchOptions, headers }, timeoutMs);
                    } catch (fallbackErr) {
                        lastError = fallbackErr;
                    }
                }

                attempt++;
                if (attempt <= (isSafeMethod ? maxRetries : 0)) {
                    const backoffMs = Math.pow(2, attempt) * 250 + Math.random() * 200;
                    await new Promise(res => setTimeout(res, backoffMs));
                }
            }
        }

        networkManager.checkHealthNow();
        throw lastError || new ApiError({ status: 0, message: 'Network connection failed.', code: 'NETWORK_FAILURE' });
    }

    async checkHealth(): Promise<boolean> {
        try {
            await this.get('/v1/health', { timeoutMs: 3000, maxRetries: 0 });
            return true;
        } catch {
            return false;
        }
    }

    async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.requestWithRetry<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
        const idempotencyKey = options?.idempotencyKey || `idemp-${crypto.randomUUID()}`;
        return this.requestWithRetry<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
            idempotencyKey
        });
    }

    async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
        const idempotencyKey = options?.idempotencyKey || `idemp-${crypto.randomUUID()}`;
        return this.requestWithRetry<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
            idempotencyKey
        });
    }

    async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        const idempotencyKey = options?.idempotencyKey || `idemp-${crypto.randomUUID()}`;
        return this.requestWithRetry<T>(endpoint, {
            ...options,
            method: 'DELETE',
            idempotencyKey
        });
    }

    async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
        const idempotencyKey = options?.idempotencyKey || `idemp-${crypto.randomUUID()}`;
        const headers: Record<string, string> = {
            'X-Request-ID': `req-${crypto.randomUUID()}`,
            'X-Idempotency-Key': idempotencyKey
        };
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem(config.auth.tokenKey) : null;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return this.requestWithRetry<T>(endpoint, {
            ...options,
            method: 'POST',
            headers,
            body: formData,
            idempotencyKey
        });
    }
}

export const api = new ApiClient();
