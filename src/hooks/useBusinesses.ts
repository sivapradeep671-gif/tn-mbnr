// TN-MBNR Business Registry Hook
// Implements Cache-First with Background Network Refresh using Multi-Store IndexedDB

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Business, CitizenReport } from '../types/types';
import { api } from '../api/client';
import { useOfflineSync } from './useOfflineSync';
import type { BusinessListResponse, BusinessSingleResponse } from '../types/api';
import { showToast } from './useToast';
import { useSaaS } from '../context/SaaSContext';
import { 
    setCachedRecord, 
    getAllCachedRecords, 
    getCachedRecord, 
    getFreshnessStatus, 
    STORES, 
    type FreshnessStatus 
} from '../db/indexedDB';

export const useBusinesses = () => {
    const { currentTenant } = useSaaS();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [freshness, setFreshness] = useState<FreshnessStatus>('FRESH');
    const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
    const stateVersionRef = useRef(0);
    const { isOnline, addToSyncQueue } = useOfflineSync();

    const fetchAll = useCallback(async () => {
        const currentVersion = ++stateVersionRef.current;
        setIsLoading(true);
        setError(null);

        // 1. Read Local IndexedDB Cache First (Cache-First)
        try {
            const cachedBizRecords = await getAllCachedRecords<Business>(STORES.BUSINESSES);
            const cachedReportRecords = await getAllCachedRecords<CitizenReport>(STORES.BUSINESS_SEARCH);

            if (cachedBizRecords.length > 0) {
                const bizData = cachedBizRecords.map(r => r.data);
                setBusinesses(bizData);

                const sampleStatus = getFreshnessStatus(cachedBizRecords[0]);
                setFreshness(sampleStatus);
                setLastSyncedAt(cachedBizRecords[0].last_synced_at);
            }
            if (cachedReportRecords.length > 0) {
                setReports(cachedReportRecords.map(r => r.data));
            }
        } catch (e) {
            console.error('Failed to read IndexedDB cache:', e);
        }

        // 2. Background Network Refresh
        try {
            const [bizRes, reportsRes] = await Promise.all([
                api.get<BusinessListResponse>(`/v1/license/registry?tenant_id=${currentTenant.id}`),
                api.get<{ data: CitizenReport[] }>('/reports').catch(() => ({ data: [] }))
            ]);

            if (currentVersion !== stateVersionRef.current) return;

            const now = Date.now();

            if (bizRes && bizRes.data && Array.isArray(bizRes.data)) {
                setBusinesses(bizRes.data);
                setFreshness('FRESH');
                setLastSyncedAt(now);

                for (const biz of bizRes.data) {
                    await setCachedRecord(STORES.BUSINESSES, biz.id, biz, 24 * 60 * 60 * 1000, 1, 'SERVER');
                }
            }

            if (reportsRes && reportsRes.data && Array.isArray(reportsRes.data)) {
                setReports(reportsRes.data);
                for (const r of reportsRes.data) {
                    await setCachedRecord(STORES.BUSINESS_SEARCH, r.id, r, 24 * 60 * 60 * 1000, 1, 'SERVER');
                }
            }
        } catch (err) {
            if (currentVersion !== stateVersionRef.current) return;

            // Retain local IndexedDB state if network fetch fails
            const cachedBizRecords = await getAllCachedRecords<Business>(STORES.BUSINESSES);
            if (cachedBizRecords.length > 0) {
                setFreshness('OFFLINE');
                showToast('Operating on Local Cache: API Grid Unreachable', 'warning');
            } else {
                // Initialize default fallback dataset into IndexedDB for offline demo
                const mockBusinesses: Business[] = [
                    { id: 'BIZ-001', tradeName: 'Anna Nagar Grand Mall', legalName: 'AGM Enterprises Pvt Ltd', type: 'Private Limited', category: 'General Trade', status: 'Verified', current_stage: 'FINAL', latitude: 13.0850, longitude: 80.2101, registrationDate: '2024-01-15T10:00:00Z', license_valid_till: '2025-01-15T00:00:00Z', contactNumber: '9876543210', license_status: 'ACTIVE' } as Business,
                    { id: 'BIZ-002', tradeName: 'Old Silk House', legalName: 'Classic Weaves LLP', type: 'Partnership', category: 'Apparel', status: 'Verified', current_stage: 'FINAL', latitude: 13.0400, longitude: 80.2333, registrationDate: '2023-01-10T10:00:00Z', license_valid_till: '2024-01-10T00:00:00Z', contactNumber: '9876543211', license_status: 'ACTIVE' } as Business,
                    { id: 'BIZ-003', tradeName: 'Sunrise Cafe', legalName: 'Naveen Foods', type: 'Sole Proprietorship', category: 'F&B', status: 'Pending', current_stage: 'SCRUTINY', latitude: 12.9800, longitude: 80.2200, registrationDate: '2024-04-10T10:00:00Z', license_valid_till: '2025-04-10T00:00:00Z', contactNumber: '9876543212', license_status: 'ACTIVE' } as Business
                ];
                setBusinesses(mockBusinesses);
                setFreshness('OFFLINE');

                for (const mb of mockBusinesses) {
                    await setCachedRecord(STORES.BUSINESSES, mb.id, mb, 24 * 60 * 60 * 1000, 1, 'OFFLINE_GENERATED');
                }

                setError(err instanceof Error ? err.message : 'Sync failed');
                showToast('Grid Sync Failed: Initialized Sandbox Mock Data', 'warning');
            }
        } finally {
            if (currentVersion === stateVersionRef.current) {
                setIsLoading(false);
            }
        }
    }, [currentTenant.id]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll, currentTenant.id]);

    const registerBusiness = async (business: Business) => {
        const businessId = business.id || `BIZ-${crypto.randomUUID().slice(0, 8)}`;
        const fullBusiness = { ...business, id: businessId };

        if (!isOnline) {
            setBusinesses(prev => [fullBusiness, ...prev]);
            await setCachedRecord(STORES.BUSINESSES, businessId, fullBusiness, 24 * 60 * 60 * 1000, 1, 'OFFLINE_GENERATED');
            await addToSyncQueue('CERTIFY', fullBusiness);
            showToast('Offline Mode: Registration queued locally for sync', 'warning');
            return fullBusiness;
        }

        try {
            const payload = { ...fullBusiness, tenant_id: currentTenant.id };
            const response = await api.post<BusinessSingleResponse>('/v1/license/register', payload);
            const newBusiness = (response && response.data) ? response.data : fullBusiness;

            stateVersionRef.current++;
            setBusinesses(prev => [newBusiness, ...prev]);
            await setCachedRecord(STORES.BUSINESSES, newBusiness.id, newBusiness, 24 * 60 * 60 * 1000, 1, 'SERVER');

            showToast('Business registered successfully', 'success');
            return newBusiness;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            showToast(message, 'error');
            throw err;
        }
    };

    const updateStatus = async (id: string, status: 'Verified' | 'Rejected', hash?: string) => {
        setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status } : b));

        const existingRecord = await getCachedRecord<Business>(STORES.BUSINESSES, id);
        if (existingRecord) {
            existingRecord.data.status = status;
            await setCachedRecord(STORES.BUSINESSES, id, existingRecord.data, 24 * 60 * 60 * 1000, existingRecord.version + 1, isOnline ? 'SERVER' : 'OFFLINE_GENERATED');
        }

        if (!isOnline) {
            await addToSyncQueue('INSPECTION', { businessId: id, status, hash });
            showToast('Inspection status update queued locally', 'info');
            return;
        }

        try {
            await api.put(`/admin/businesses/${id}/status`, { status, inspectorHash: hash });
            stateVersionRef.current++;
            showToast(`Status updated to ${status}`, 'success');
        } catch (err) {
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
        freshness,
        lastSyncedAt,
        refresh: fetchAll,
        registerBusiness,
        updateStatus
    };
};
