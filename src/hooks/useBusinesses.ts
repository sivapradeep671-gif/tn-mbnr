import { useState, useEffect, useCallback, useRef } from 'react';
import type { Business, CitizenReport } from '../types/types';
import { api } from '../api/client';
import { useOfflineSync } from './useOfflineSync';
import type { BusinessListResponse, BusinessSingleResponse } from '../types/api';
import { showToast } from './useToast';
import { useSaaS } from '../context/SaaSContext';
import { config } from '../config';

export const useBusinesses = () => {
    const { currentTenant } = useSaaS();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const stateVersionRef = useRef(0);
    const { isOnline, addToSyncQueue } = useOfflineSync();

    const fetchAll = useCallback(async () => {
        const currentVersion = ++stateVersionRef.current;
        setIsLoading(true);
        setError(null);
        try {
            if (config.env === 'production') {
                throw new Error('Sandbox Mode Active: Bypassing Backend API');
            }

            const [bizRes, reportsRes] = await Promise.all([
                api.get<BusinessListResponse>(`/v1/license/registry?tenant_id=${currentTenant.id}`),
                api.get<{ data: CitizenReport[] }>('/reports')
            ]);
            
            if (currentVersion !== stateVersionRef.current) return;

            if (bizRes.data) {
                setBusinesses(bizRes.data);
                localStorage.setItem('tn_mbnr_cache_businesses', JSON.stringify(bizRes.data));
            }
            if (reportsRes.data) {
                setReports(reportsRes.data);
                localStorage.setItem('tn_mbnr_cache_reports', JSON.stringify(reportsRes.data));
            }
        } catch (err) {
            if (currentVersion !== stateVersionRef.current) return;
            
            // Fallback to cache
            const cachedBiz = localStorage.getItem('tn_mbnr_cache_businesses');
            const cachedReports = localStorage.getItem('tn_mbnr_cache_reports');
            
            if (cachedBiz) {
                setBusinesses(JSON.parse(cachedBiz));
                showToast('Operating on Local Cache: API Grid Unreachable', 'warning');
            } else {
                // Hardcoded Sandbox Data for Live Demo (GitHub Pages)
                const mockBusinesses: Business[] = [
                    { id: 'BIZ-001', tradeName: 'Anna Nagar Grand Mall', legalName: 'AGM Enterprises Pvt Ltd', type: 'Private Limited', category: 'General Trade', status: 'Verified', current_stage: 'FINAL', latitude: 13.0850, longitude: 80.2101, registrationDate: '2024-01-15T10:00:00Z', license_valid_till: '2025-01-15T00:00:00Z', contactNumber: '9876543210', license_status: 'ACTIVE' } as Business,
                    { id: 'BIZ-002', tradeName: 'Old Silk House', legalName: 'Classic Weaves LLP', type: 'Partnership', category: 'Apparel', status: 'Verified', current_stage: 'FINAL', latitude: 13.0400, longitude: 80.2333, registrationDate: '2023-01-10T10:00:00Z', license_valid_till: '2024-01-10T00:00:00Z', contactNumber: '9876543211', license_status: 'ACTIVE' } as Business,
                    { id: 'BIZ-003', tradeName: 'Sunrise Cafe', legalName: 'Naveen Foods', type: 'Sole Proprietorship', category: 'F&B', status: 'Pending', current_stage: 'SCRUTINY', latitude: 12.9800, longitude: 80.2200, registrationDate: '2024-04-10T10:00:00Z', license_valid_till: '2025-04-10T00:00:00Z', contactNumber: '9876543212', license_status: 'ACTIVE' } as Business
                ];
                setBusinesses(mockBusinesses);
                localStorage.setItem('tn_mbnr_cache_businesses', JSON.stringify(mockBusinesses));
                setError(err instanceof Error ? err.message : 'Sync failed');
                showToast('Grid Sync Failed: Initialized Sandbox Mock Data', 'warning');
            }

            if (cachedReports) {
                setReports(JSON.parse(cachedReports));
            } else {
                const mockReports: CitizenReport[] = [
                    { id: 'REP-001', business_name: 'Unregistered Stall', location: 'Near Anna Statue', description: 'Operating without valid TrustReg QR code', severity: 'High', status: 'Under Review', timestamp: new Date().toISOString() } as CitizenReport
                ];
                setReports(mockReports);
                localStorage.setItem('tn_mbnr_cache_reports', JSON.stringify(mockReports));
            }
        } finally {
            if (currentVersion === stateVersionRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll, currentTenant.id]);

    const registerBusiness = async (business: Business) => {
        if (!isOnline) {
            // Optimistic Update
            setBusinesses(prev => [business, ...prev]);
            addToSyncQueue('CERTIFY', business);
            showToast('Offline Mode: Registration queued locally', 'warning');
            return business;
        }

        try {
            const payload = { ...business, tenant_id: currentTenant.id };
            // Note: Currently pointing to v1/license/register
            const response = await api.post<BusinessSingleResponse>('/v1/license/register', payload);
            const newBusiness = response.data || business;
            
            stateVersionRef.current++;
            setBusinesses(prev => [newBusiness, ...prev]);
            
            showToast('Business registered successfully', 'success');
            return newBusiness;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            showToast(message, 'error');
            throw err;
        }
    };

    const updateStatus = async (id: string, status: 'Verified' | 'Rejected', hash?: string) => {
        // Optimistic Update
        setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status } : b));
        
        if (!isOnline) {
            addToSyncQueue('INSPECTION', { businessId: id, status, hash });
            showToast('Action queued for background synchronization', 'info');
            return;
        }

        try {
            await api.put(`/admin/businesses/${id}/status`, { status, inspectorHash: hash });
            stateVersionRef.current++;
            showToast(`Status updated to ${status}`, 'success');
        } catch (err) {
            // Rollback on failure if online
            fetchAll(); 
            const message = err instanceof Error ? err.message : 'Update failed';
            showToast(message, 'error');
        }
    };

    return {
        businesses,
        reports,
        isLoading,
        error,
        refresh: fetchAll,
        registerBusiness,
        updateStatus
    };
};
