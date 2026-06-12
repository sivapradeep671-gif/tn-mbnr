// Centralized API Client

import { config } from '../config';

class ApiClient {
    private baseUrl: string = config.apiUrl;

    private getHeaders() {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        const token = localStorage.getItem(config.auth.tokenKey);
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            if (isJson) {
                const errorData = await response.json().catch(() => ({}));
                errorMessage = errorData.error || errorMessage;
            }
            throw new Error(errorMessage);
        }

        if (!isJson) {
            // If we're on a static host like GH Pages, we might get HTML back for 404s
            // We should treat this as a backend offline scenario
            throw new Error('Invalid API response: Expected JSON but received HTML. Backend may be offline or misconfigured.');
        }

        return response.json();
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                headers: { 'Accept': 'application/json' }
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: this.getHeaders(),
        });
        return this.handleResponse<T>(response);
    }

    async post<T>(endpoint: string, body: unknown): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        return this.handleResponse<T>(response);
    }

    async put<T>(endpoint: string, body: unknown): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        return this.handleResponse<T>(response);
    }

    async upload<T>(endpoint: string, formData: FormData): Promise<T> {
        const headers: HeadersInit = {};
        const token = localStorage.getItem(config.auth.tokenKey);
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Note: fetch automatically sets content-type for FormData with boundary
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData,
        });
        return this.handleResponse<T>(response);
    }
}

export const api = new ApiClient();
