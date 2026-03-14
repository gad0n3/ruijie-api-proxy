const config = require("../config");
const { getFirestore } = require("../firebase/firebase");
const { InternalServerError, ValidationError } = require("../helpers/AppError");

/**
 * Retrieves the Firestore collection for VIP credentials.
 * @returns {FirebaseFirestore.CollectionReference}
 * @throws {InternalServerError} If Firebase is not initialized.
 */
function getCollection() {
  const db = getFirestore();

  if (!db) {
    throw new InternalServerError(
      "Firestore is not initialized. Configure Firebase to use VIP credential mapping.",
    );
  }

  return db.collection(config.vipAuth.collection);
}

/**
 * Lists VIP credentials from Firestore.
 * @param {number} [limit=500] - Maximum number of credentials to return.
 * @returns {Promise<object[]>}
 */
async function listVipCredentials(limit = 500) {
  const collection = getCollection();
  const snapshot = await collection.limit(Number(limit) || 500).get();

  return snapshot.docs.map((doc) => doc.data());
}

/**
 * Creates or updates a VIP credential mapping.
 * @param {object} params - Mapping details.
 * @param {string} params.username - VIP username.
 * @param {string} params.password - VIP password.
 * @param {string} params.appid - Mapped application ID.
 * @param {string} params.secret - Mapped application secret.
 * @returns {Promise<{ success: boolean }>}
 * @throws {ValidationError} If required fields are missing.
 */
async function upsertVipCredential({ username, password, appid, secret }) {
  const normalizedUsername = String(username || "").trim();
  const normalizedAppId = String(appid || "").trim();
  const normalizedSecret = String(secret || "").trim();

  if (
    !normalizedUsername ||
    !password ||
    !normalizedAppId ||
    !normalizedSecret
  ) {
    throw new ValidationError(
      "username, password, appid, and secret are required",
    );
  }

  const collection = getCollection();
  const nowIso = new Date().toISOString();

  await collection.doc(normalizedUsername).set(
    {
      username: normalizedUsername,
      password,
      appid: normalizedAppId,
      secret: normalizedSecret,
      updatedAt: nowIso,
    },
    { merge: true },
  );

  return { success: true };
}

/**
 * Deletes a VIP credential mapping.
 * @param {string} username - The VIP username to delete.
 * @returns {Promise<{ success: boolean }>}
 * @throws {ValidationError} If username is missing.
 */
async function deleteVipCredential(username) {
  const normalizedUsername = String(username || "").trim();

  if (!normalizedUsername) {
    throw new ValidationError("username is required");
  }

  const collection = getCollection();
  await collection.doc(normalizedUsername).delete();

  return { success: true };
}

/**
 * Verifies VIP credentials and returns the mapped app credentials.
 * @param {string} username - VIP username.
 * @param {string} password - VIP password.
 * @returns {Promise<{ appid: string; secret: string } | null>}
 */
async function verifyVipCredential(username, password) {
  const normalizedUsername = String(username || "").trim();
  const normalizedPassword = String(password || "");

  if (!normalizedUsername || !normalizedPassword) {
    return null;
  }

  const collection = getCollection();
  const doc = await collection.doc(normalizedUsername).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();

  // Note: Password should ideally be hashed to match adminStore security standards.
  if (data.password === normalizedPassword) {
    return {
      appid: data.appid,
      secret: data.secret,
    };
  }

  return null;
}

module.exports = {
  listVipCredentials,
  upsertVipCredential,
  deleteVipCredential,
  verifyVipCredential,
};
