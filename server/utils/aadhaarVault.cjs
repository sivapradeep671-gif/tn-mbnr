/**
 * TN-MBNR Aadhaar Data Vault (ADV) - Microservice Stub
 * 
 * In a true production environment (as per UIDAI mandates), the ADV is a physically isolated
 * server (often hardware-encrypted) that stores the mapping between a random UUID (Reference Key)
 * and the actual AES-256 encrypted Aadhaar number.
 * 
 * The primary application database NEVER stores the Aadhaar number, only the Reference Key.
 */

const crypto = require('crypto');
const logger = require('./logger.cjs');

// In production, this would be an external API call to the ADV server
// For this prototype, we simulate the vault using an in-memory Map
const _mockVaultStorage = new Map();

// ADV Master Key (Simulating an HSM-backed key)
const ADV_MASTER_KEY = crypto.scryptSync(process.env.ADV_SECRET || 'vault-secret-dev', 'salt', 32);

/**
 * Encrypts data specifically for the vault
 */
function encryptForVault(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ADV_MASTER_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts data specifically for the vault
 */
function decryptFromVault(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ADV_MASTER_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const AadhaarVault = {
    /**
     * Store an Aadhaar number and return a Reference Token.
     * @param {string} aadhaarNumber 
     * @returns {string} The Reference Token to store in the main database
     */
    tokenize: async (aadhaarNumber) => {
        try {
            // Generate a secure random UUID-v4 reference token
            const referenceToken = crypto.randomUUID();
            
            // Encrypt the actual Aadhaar number
            const encryptedAadhaar = encryptForVault(aadhaarNumber);
            
            // Store mapping in the Vault (simulated network request)
            _mockVaultStorage.set(referenceToken, encryptedAadhaar);
            
            logger.info('ADV Tokenization', { 
                event: 'aadhaar_tokenized',
                token: referenceToken 
            });

            return referenceToken;
        } catch (error) {
            logger.error('ADV Tokenization Failed', { error: error.message });
            throw new Error('Vault service unavailable');
        }
    },

    /**
     * Retrieve an Aadhaar number using its Reference Token.
     * Only authorized internal microservices should have access to this.
     * @param {string} referenceToken 
     * @returns {string} The decrypted Aadhaar number
     */
    detokenize: async (referenceToken) => {
        try {
            const encryptedAadhaar = _mockVaultStorage.get(referenceToken);
            
            if (!encryptedAadhaar) {
                throw new Error('Reference Token not found in Vault');
            }

            const decryptedAadhaar = decryptFromVault(encryptedAadhaar);
            
            logger.info('ADV Detokenization', { 
                event: 'aadhaar_detokenized',
                token: referenceToken 
            });

            return decryptedAadhaar;
        } catch (error) {
            logger.error('ADV Detokenization Failed', { error: error.message, token: referenceToken });
            throw new Error('Vault service unavailable or invalid token');
        }
    },

    /**
     * Permanently delete an Aadhaar mapping (Right to be Forgotten / Consent Revoked)
     * @param {string} referenceToken 
     */
    purge: async (referenceToken) => {
        _mockVaultStorage.delete(referenceToken);
        logger.info('ADV Data Purged', { 
            event: 'aadhaar_purged_from_vault',
            token: referenceToken 
        });
        return true;
    }
};

module.exports = AadhaarVault;
