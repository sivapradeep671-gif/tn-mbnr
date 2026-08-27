import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBusinesses } from './useBusinesses';
import { api } from '../api/client';
import { showToast } from './useToast';
import { SaaSProvider } from '../context/SaaSContext';
import type { Business, CitizenReport } from '../types/types';
import type { BusinessListResponse, BusinessSingleResponse, ApiResponse } from '../types/api';

// Mock the API client
vi.mock('../api/client', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    }
}));

// Mock the showToast hook
vi.mock('./useToast', () => ({
    showToast: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(SaaSProvider, null, children);

describe('useBusinesses Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should fetch businesses and reports on mount', async () => {
        const mockBusinesses = [{ id: '1', tradeName: 'Shop 1', status: 'Verified' }] as unknown as Business[];
        const mockReports = [{ id: 'r1', complaint: 'Fraud' }] as unknown as CitizenReport[];

        vi.mocked(api.get).mockImplementation((url: string) => {
            if (url.startsWith('/v1/license/registry')) return Promise.resolve({ data: mockBusinesses } as unknown as BusinessListResponse);
            if (url === '/reports') return Promise.resolve({ data: mockReports } as unknown as { data: CitizenReport[] });
            return Promise.resolve({ data: [] } as unknown as BusinessListResponse);
        });

        const { result } = renderHook(() => useBusinesses(), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.businesses).toEqual(mockBusinesses);
        expect(result.current.reports).toEqual(mockReports);
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/v1/license/registry'));
        expect(api.get).toHaveBeenCalledWith('/reports');
    });

    it('should handle registration of a new business', async () => {
        const newBiz = { id: '2', tradeName: 'New Shop' } as unknown as Business;
        vi.mocked(api.post).mockResolvedValue({ data: { ...newBiz, serverId: 'xyz' } } as unknown as BusinessSingleResponse);
        vi.mocked(api.get).mockResolvedValue({ data: [] } as unknown as BusinessListResponse);

        const { result } = renderHook(() => useBusinesses(), { wrapper });

        // Wait for initial fetch to finish so we don't have race conditions
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        let registered: Business | undefined;
        await act(async () => {
            registered = await result.current.registerBusiness(newBiz);
        });

        expect(registered).toBeDefined();
        expect((registered as unknown as { serverId: string }).serverId).toBe('xyz');
        
        // Wait for state to settle
        await waitFor(() => {
            expect(result.current.businesses.length).toBeGreaterThan(0);
        });
        expect((result.current.businesses[0] as unknown as { serverId: string }).serverId).toBe('xyz');
        
        expect(showToast).toHaveBeenCalledWith('Business registered successfully', 'success');
    });

    it('should handle API errors during fetch', async () => {
        vi.mocked(api.get).mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useBusinesses(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(showToast).toHaveBeenCalledWith('Grid Sync Failed: Initialized Sandbox Mock Data', 'warning');
        });

        expect(result.current.error).toBe('Network Error');
    });

    it('should update business status successfully', async () => {
        const initialBiz = { id: '1', tradeName: 'Shop 1', status: 'Pending' } as unknown as Business;
        vi.mocked(api.get).mockImplementation((url: string) => {
            if (url.startsWith('/v1/license/registry')) return Promise.resolve({ data: [initialBiz] } as unknown as BusinessListResponse);
            return Promise.resolve({ data: [] } as unknown as BusinessListResponse);
        });
        vi.mocked(api.put).mockResolvedValue({ success: true } as unknown as ApiResponse<void>);

        const { result } = renderHook(() => useBusinesses(), { wrapper });

        await waitFor(() => {
            expect(result.current.businesses.length).toBe(1);
        });

        await act(async () => {
            await result.current.updateStatus('1', 'Verified');
        });

        expect(api.put).toHaveBeenCalledWith('/admin/businesses/1/status', { status: 'Verified', inspectorHash: undefined });
        expect(result.current.businesses[0].status).toBe('Verified');
        expect(showToast).toHaveBeenCalledWith('Status updated to Verified', 'success');
    });
});
