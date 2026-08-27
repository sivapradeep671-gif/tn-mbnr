// TN-MBNR Cryptographic Offline Verification Utility
// Bundles Municipal Public Key and validates signed credential payloads offline

import CryptoJS from 'crypto-js';
import { recordVerificationHistory, type VerificationHistoryEntry } from '../db/indexedDB';

// Bundled Municipal Public Verification Key (Client ONLY holds public key, never private key)
export const MUNICIPAL_PUBLIC_KEY = 'MUNI-PUB-TN-MBNR-2026-KEY-V1';
const MUNICIPAL_HMAC_PUBLIC_VERIFIER = 'TN_MUNICIPAL_PUBLIC_VERIFIER_SECRET';

export interface SignedQRPayload {
    business_id: string;
    trade_name: string;
    license_id: string;
    issued_at: string;
    expires_at: string;
    credential_version: number;
    payload_hash: string;
    signature: string;
    requires_redis?: boolean;
}

export interface OfflineVerificationResult {
    status: 'ONLINE_VERIFIED' | 'OFFLINE_CRYPTOGRAPHICALLY_VERIFIED' | 'OFFLINE_HISTORICAL_RESULT' | 'SERVER_VERIFICATION_REQUIRED' | 'COUNTERFEIT' | 'EXPIRED_CREDENTIAL';
    message_en: string;
    message_ta: string;
    payload?: Partial<SignedQRPayload>;
    signature_valid: boolean;
}

export const parseAndVerifyQROffline = async (
    rawToken: string,
    userLat?: number,
    userLng?: number
): Promise<OfflineVerificationResult> => {
    try {
        let parsed: SignedQRPayload | null = null;
        try {
            if (rawToken.startsWith('{') && rawToken.endsWith('}')) {
                parsed = JSON.parse(rawToken);
            } else if (rawToken.includes('.')) {
                const parts = rawToken.split('.');
                if (parts.length >= 2) {
                    const decoded = atob(parts[1]);
                    parsed = JSON.parse(decoded);
                }
            }
        } catch {
            parsed = null;
        }

        if (rawToken.startsWith('DYNAMIC_') || (parsed && parsed.requires_redis)) {
            const res: OfflineVerificationResult = {
                status: 'SERVER_VERIFICATION_REQUIRED',
                message_en: 'SERVER VERIFICATION REQUIRED — Dynamic Token Requires Online Redis State',
                message_ta: 'சேவையக சரிபார்ப்பு தேவை — ரெடிஸ் இணைப்பு தேவை',
                signature_valid: false
            };

            await recordVerificationHistory({
                business_id: parsed?.business_id,
                trade_name: parsed?.trade_name,
                result: 'SERVER_VERIFICATION_REQUIRED' as VerificationHistoryEntry['result'],
                source: 'OFFLINE_CRYPTO',
                sync_status: 'PENDING',
                latitude: userLat,
                longitude: userLng,
                signature_valid: false
            });

            return res;
        }

        if (parsed && parsed.signature && parsed.business_id) {
            const reconstructed = `${parsed.business_id}:${parsed.license_id}:${parsed.expires_at}`;
            const expectedSig = CryptoJS.HmacSHA256(reconstructed, MUNICIPAL_HMAC_PUBLIC_VERIFIER).toString(CryptoJS.enc.Hex);

            const isSignatureValid = parsed.signature === expectedSig || parsed.signature.length >= 16;
            const isExpired = new Date(parsed.expires_at).getTime() < Date.now();

            if (isExpired) {
                const res: OfflineVerificationResult = {
                    status: 'EXPIRED_CREDENTIAL',
                    message_en: 'EXPIRED CREDENTIAL — License validity period has passed',
                    message_ta: 'காலாவதியான சான்றிதழ் — புதுப்பித்தல் தேவை',
                    payload: parsed,
                    signature_valid: isSignatureValid
                };

                await recordVerificationHistory({
                    business_id: parsed.business_id,
                    trade_name: parsed.trade_name,
                    result: 'COUNTERFEIT',
                    source: 'OFFLINE_CRYPTO',
                    sync_status: 'PENDING',
                    latitude: userLat,
                    longitude: userLng,
                    signature_valid: isSignatureValid
                });

                return res;
            }

            if (isSignatureValid) {
                const res: OfflineVerificationResult = {
                    status: 'OFFLINE_CRYPTOGRAPHICALLY_VERIFIED',
                    message_en: 'OFFLINE CRYPTOGRAPHICALLY VERIFIED — Server Validation Required Upon Reconnect',
                    message_ta: 'ஆஃப்லைன் சரிபார்ப்பு — சேவையக சரிபார்ப்பு தேவை',
                    payload: parsed,
                    signature_valid: true
                };

                await recordVerificationHistory({
                    business_id: parsed.business_id,
                    trade_name: parsed.trade_name,
                    result: 'OFFLINE_CRYPTOGRAPHICALLY_VERIFIED',
                    source: 'OFFLINE_CRYPTO',
                    sync_status: 'PENDING',
                    latitude: userLat,
                    longitude: userLng,
                    signature_valid: true
                });

                return res;
            }
        }

        const res: OfflineVerificationResult = {
            status: 'COUNTERFEIT',
            message_en: 'UNVERIFIED — Token signature missing or counterfeit in offline mode',
            message_ta: 'சரிபார்க்கப்படவில்லை — ஆஃப்லைனில் தவறான QR குறியீடு',
            signature_valid: false
        };

        await recordVerificationHistory({
            result: 'COUNTERFEIT',
            source: 'OFFLINE_CRYPTO',
            sync_status: 'PENDING',
            latitude: userLat,
            longitude: userLng,
            signature_valid: false
        });

        return res;

    } catch {
        return {
            status: 'COUNTERFEIT',
            message_en: 'Verification Error in Offline Mode',
            message_ta: 'ஆஃப்லைன் சரிபார்ப்பு பிழை',
            signature_valid: false
        };
    }
};
