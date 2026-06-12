/**
 * Server Configuration & Secrets Management (AWS Secrets Manager Integrated)
 */
const path = require('path');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let isLoaded = false;
const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  auth: { secret: 'tn-mbnr-auth-secret-dev-only-2025', expiresIn: '24h' },
  qr: { secret: 'tn-mbnr-qr-secret-dev-only-2025', expiryMs: 30000 },
  db: { path: process.env.DB_PATH || './tn_mbnr.db', uri: process.env.MONGODB_URI },
  ai: { geminiKey: process.env.VITE_GEMINI_API_KEY },
  communications: {
    twilioSid: process.env.TWILIO_ACCOUNT_SID,
    twilioToken: process.env.TWILIO_AUTH_TOKEN,
    sendgridKey: process.env.SENDGRID_API_KEY
  }
};

/**
 * Bootstraps the application configuration by pulling from AWS Secrets Manager
 * if running in a production or staging environment.
 */
async function loadSecrets() {
  if (isLoaded) return config;

  // Use Render's environment variables (process.env) as the primary source of truth.
  // We still try to load from AWS Secrets Manager if configured, but we do NOT halt on failure.
  if (config.env === 'production' || config.env === 'staging') {
    try {
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        const client = new SecretsManagerClient({ region: 'ap-south-1' });
        const command = new GetSecretValueCommand({ SecretId: `tn-mbnr/${config.env}/credentials` });
        const response = await client.send(command);
        
        const vault = JSON.parse(response.SecretString);
        
        config.auth.secret = vault.AUTH_SECRET || config.auth.secret;
        config.qr.secret = vault.QR_SECRET_KEY || config.qr.secret;
        config.db.uri = vault.MONGODB_URI || config.db.uri;
        config.ai.geminiKey = vault.VITE_GEMINI_API_KEY || config.ai.geminiKey;
        config.communications.twilioSid = vault.TWILIO_ACCOUNT_SID || config.communications.twilioSid;
        config.communications.twilioToken = vault.TWILIO_AUTH_TOKEN || config.communications.twilioToken;
        config.communications.sendgridKey = vault.SENDGRID_API_KEY || config.communications.sendgridKey;
        
        console.log(`[SecretsManager] Successfully loaded secure credentials for ${config.env}`);
      } else {
        console.log(`[SecretsManager] AWS credentials not found in env. Falling back to native environment variables.`);
      }
    } catch (error) {
      console.warn(`[SecretsManager] Could not retrieve secrets from AWS: ${error.message}. Falling back to native environment variables.`);
    }
  }

  // Always apply local/Render environment variables on top of defaults
  config.auth.secret = process.env.AUTH_SECRET || config.auth.secret;
  config.qr.secret = process.env.QR_SECRET_KEY || config.qr.secret;
  config.db.uri = process.env.MONGODB_URI || config.db.uri;
  config.ai.geminiKey = process.env.VITE_GEMINI_API_KEY || config.ai.geminiKey;
  config.communications.twilioSid = process.env.TWILIO_ACCOUNT_SID || config.communications.twilioSid;
  config.communications.twilioToken = process.env.TWILIO_AUTH_TOKEN || config.communications.twilioToken;
  config.communications.sendgridKey = process.env.SENDGRID_API_KEY || config.communications.sendgridKey;
  
  isLoaded = true;
  return config;
}

// Export the config object synchronously for initial reads, 
// and the async loader to block server startup until secrets are resolved.
module.exports = {
  config,
  loadSecrets
};
