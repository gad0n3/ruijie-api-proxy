const path = require("path");
const dotenv = require("dotenv");
const { InternalServerError } = require("./helpers/AppError");

dotenv.config({ path: path.join(__dirname, ".env") });

const upstreamBaseUrl =
  process.env.UPSTREAM_BASE_URL ||
  process.env.RUIJIE_UPSTREAM_BASE_URL ||
  process.env.UPSTREAM_URL ||
  "";

if (!upstreamBaseUrl) {
  throw new InternalServerError(
    "UPSTREAM_BASE_URL is not set in environment variables. Please configure it.",
  );
}

/**
 * @typedef {object} FirebaseConfig
 * @property {string} projectId - Firebase project ID.
 * @property {string} clientEmail - Firebase client email.
 * @property {string} privateKey - Firebase private key.
 * @property {string} serviceAccountPath - Path to Firebase service account key file.
 */

/**
 * @typedef {object} AdminAuthConfig
 * @property {string} collection - Firebase collection for admin users.
 * @property {string} defaultUsername - Default admin username.
 * @property {string} defaultPassword - Default admin password.
 * @property {string} sessionSecret - Secret for admin session cookies.
 * @property {number} sessionTtlSeconds - Admin session time-to-live in seconds.
 */

/**
 * @typedef {object} VipAuthConfig
 * @property {string} collection - Firebase collection for VIP credentials.
 */

/**
 * @typedef {object} AppConfig
 * @property {number} port - The port the server listens on.
 * @property {string} upstreamBaseUrl - Base URL for the upstream Ruijie API.
 * @property {number} upstreamTimeoutMs - Timeout for upstream HTTP requests in milliseconds.
 * @property {string} ruijieLoginToken - Ruijie login token for initial authentication.
 * @property {string} firebaseSessionCollection - Firebase collection name for user sessions.
 * @property {FirebaseConfig} firebase - Firebase configuration details.
 * @property {AdminAuthConfig} adminAuth - Admin authentication configuration.
 * @property {VipAuthConfig} vipAuth - VIP authentication configuration.
 */

/** @type {AppConfig} */
module.exports = {
  port: Number(process.env.PORT || 3000),
  upstreamBaseUrl,
  upstreamTimeoutMs: Number(process.env.UPSTREAM_TIMEOUT_MS || 15000),
  ruijieLoginToken:
    process.env.RUIJIE_LOGIN_TOKEN || "d63dss0a81e4415a889ac5b78fsc904a",
  firebaseSessionCollection: process.env.FIREBASE_SESSION_COLLECTION || "start",
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY || "",
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "",
  },
  adminAuth: {
    collection: process.env.FIREBASE_ADMIN_COLLECTION || "admin_users",
    defaultUsername: process.env.ADMIN_USERNAME || "admin",
    defaultPassword: process.env.ADMIN_PASSWORD || "admin12345",
    sessionSecret:
      process.env.ADMIN_SESSION_SECRET || "change-this-admin-session-secret",
    sessionTtlSeconds: Number(process.env.ADMIN_SESSION_TTL_SECONDS || 43200),
  },
  vipAuth: {
    collection:
      process.env.FIREBASE_VIP_CREDENTIAL_COLLECTION || "vip_credentials",
  },
  isProduction: process.env.NODE_ENV === "production",
};
