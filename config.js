const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const upstreamBaseUrl =
  process.env.UPSTREAM_BASE_URL ||
  process.env.RUIJIE_UPSTREAM_BASE_URL ||
  process.env.UPSTREAM_URL ||
  '';

module.exports = {
  port: Number(process.env.PORT || 3000),
  upstreamBaseUrl,
  upstreamTimeoutMs: Number(process.env.UPSTREAM_TIMEOUT_MS || 15000),
  ruijieLoginToken: process.env.RUIJIE_LOGIN_TOKEN || 'd63dss0a81e4415a889ac5b78fsc904a',
  firebaseSessionCollection: process.env.FIREBASE_SESSION_COLLECTION || 'start',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || ''
  }
};
