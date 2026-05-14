import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBusinesses } from './useBusinesses';
import { api } from '../api/client';
import { showToast } from './useToast';

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

describe('useBusinesses Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should fetch businesses and reports on mount', async () => {
        const mockBusinesses = [{ id: '1', name: 'Shop 1', status: 'Verified' }];
        const mockReports = [{ id: 'r1', complaint: 'Fraud' }];

        (api.get as any).mockImplementation((url: string) => {
            if (url === '/businesses') return Promise.resolve({ data: mockBusinesses });
            if (url === '/reports') return Promise.resolve({ data: mockReports });
            return Promise.resolve({ data: [] });
        });

        const { result } = renderHook(() => useBusinesses());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.businesses).toEqual(mockBusinesses);
        expect(result.current.reports).toEqual(mockReports);
        expect(api.get).toHaveBeenCalledWith('/businesses');
        expect(api.get).toHaveBeenCalledWith('/reports');
    });

    it('should handle registration of a new business', async () => {
        const newBiz = { id: '2', name: 'New Shop' } as any;
        (api.post as any).mockResolvedValue({ data: { ...newBiz, serverId: 'xyz' } });
        (api.get as any).mockResolvedValue({ data: [] });

        const { result } = renderHook(() => useBusinesses());

        // Wait for initial fetch to finish so we don't have race conditions
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        let registered: any;
        await act(async () => {
            registered = await result.current.registerBusiness(newBiz);
        });

        expect(registered).toBeDefined();
        expect(registered.serverId).toBe('xyz');
        
        // Wait for state to settle
        await waitFor(() => {
            expect(result.current.businesses.length).toBeGreaterThan(0);
        });
        expect((result.current.businesses[0] as any).serverId).toBe('xyz');
        
        expect(showToast).toHaveBeenCalledWith('Business registered successfully', 'success');
    });

    it('should handle API errors during fetch', async () => {
        (api.get as any).mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useBusinesses());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Network Error');
        expect(showToast).toHaveBeenCalledWith('Grid Sync Failed: Running Sandbox Mode', 'error');
    });

    it('should update business status successfully', async () => {
        const initialBiz = { id: '1', name: 'Shop 1', status: 'Pending' } as any;
        (api.get as any).mockImplementation((url: string) => {
            if (url === '/businesses') return Promise.resolve({ data: [initialBiz] });
            return Promise.resolve({ data: [] });
        });
        (api.put as any).mockResolvedValue({ success: true });

        const { result } = renderHook(() => useBusinesses());

        await waitFor(() => {
            expect(result.current.businesses.length).toBe(1);
        });

        await act(async () => {
            await result.current.updateStatus('1', 'Verified');
        });

        expect(api.put).toHaveBeenCalledWith('/admin/businesses/1/status', { status: 'Verified' });
        expect(result.current.businesses[0].status).toBe('Verified');
        expect(showToast).toHaveBeenCalledWith('Status updated to Verified', 'success');
    });
});
