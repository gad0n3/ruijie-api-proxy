const config = require("../config");
const { getFirestore } = require("../firebase/firebase");
const { InternalServerError, ValidationError } = require("../helpers/AppError");

/**
 * Retrieves the Firestore collection for sessions.
 * Throws InternalServerError if Firebase is not initialized.
 * @returns {FirebaseFirestore.CollectionReference} The Firestore collection.
 * @throws {InternalServerError} If Firebase is not initialized.
 */
function getCollection() {
  const db = getFirestore();

  if (!db) {
    throw new InternalServerError(
      "Firebase is not initialized. Configure Firebase credentials to use login sessions.",
    );
  }

  return db.collection(config.firebaseSessionCollection);
}

/**
 * @typedef {object} SessionRepository
 * @property {(appid: string, payload: object) => Promise<void>} saveByAppId - Saves a session by app ID.
 * @property {(appid: string) => Promise<object|null>} getByAppId - Retrieves a session by app ID.
 * @property {(limit?: number) => Promise<object[]>} listAll - Lists all sessions, optionally with a limit.
 */

/**
 * Creates a session repository for managing user sessions in Firebase Firestore.
 * @returns {SessionRepository} An object implementing the SessionRepository interface.
 */
function createSessionRepository() {
  return {
    /**
     * Saves or updates a session in Firestore using the provided app ID.
     * @param {string} appid - The application ID (used as document ID).
     * @param {object} payload - The session data to save or merge.
     * @returns {Promise<void>}
     * @throws {ValidationError} If appid is missing.
     * @throws {InternalServerError} If Firebase is not initialized.
     */
    async saveByAppId(appid, payload) {
      if (!appid) {
        throw new ValidationError("appid is required to save session.");
      }

      const collection = getCollection();
      const docRef = collection.doc(String(appid));
      const existing = await docRef.get();
      const existingData = existing.exists ? existing.data() : {};
      const nowIso = new Date().toISOString();

      await docRef.set({
        ...existingData,
        ...payload,
        appid: String(appid),
        createdAt: existingData.createdAt || nowIso,
        updatedAt: nowIso,
      });
    },

    /**
     * Retrieves a session from Firestore by its app ID.
     * @param {string} appid - The application ID.
     * @returns {Promise<object|null>} The session data, or null if not found.
     * @throws {InternalServerError} If Firebase is not initialized.
     */
    async getByAppId(appid) {
      return getSessionByAppId(appid);
    },

    /**
     * Lists all sessions stored in Firestore, sorted by update/creation time.
     * @param {number} [limit=200] - The maximum number of sessions to return.
     * @returns {Promise<object[]>} An array of session data objects.
     * @throws {InternalServerError} If Firebase is not initialized.
     */
    async listAll(limit = 200) {
      const collection = getCollection();
      const snapshot = await collection.get();

      const rows = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      rows.sort((a, b) => {
        const aTime = Date.parse(a.updatedAt || a.createdAt || 0);
        const bTime = Date.parse(b.updatedAt || b.createdAt || 0);

        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
        if (Number.isNaN(aTime)) return 1;
        if (Number.isNaN(bTime)) return -1;
        return bTime - aTime;
      });

      return rows.slice(0, Number(limit) || 200);
    },
  };
}

/**
 * Standalone helper to retrieve a session from Firestore by its app ID.
 * Used by module-specific session repositories for delegation.
 * @param {string} appid - The application ID.
 * @returns {Promise<object|null>} The session data, or null if not found.
 * @throws {InternalServerError} If Firebase is not initialized.
 */
async function getSessionByAppId(appid) {
  if (!appid) {
    return null;
  }

  const collection = getCollection();
  const snapshot = await collection.doc(String(appid)).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data();
}

module.exports = {
  createSessionRepository,
  getSessionByAppId,
};
