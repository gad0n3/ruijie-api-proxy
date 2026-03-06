const crypto = require('crypto');
const config = require('../config');
const { getFirestore } = require('../firebase/firebase');

function getCollection() {
  const db = getFirestore();

  if (!db) {
    throw new Error('Firestore is not initialized. Configure Firebase to use admin login.');
  }

  return db.collection(config.adminAuth.collection);
}

function hashPassword(password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const derived = crypto.scryptSync(String(password), salt, 64);

  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const saltHex = parts[1];
  const expectedHex = parts[2];
  const actualHash = hashPassword(password, saltHex);
  const actualHex = actualHash.split('$')[2];

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}

async function ensureDefaultAdminCredentials() {
  const username = String(config.adminAuth.defaultUsername || '').trim();
  const password = String(config.adminAuth.defaultPassword || '');

  if (!username || !password) {
    return;
  }

  const collection = getCollection();
  const docRef = collection.doc(username);
  const snapshot = await docRef.get();

  if (snapshot.exists) {
    return;
  }

  const nowIso = new Date().toISOString();
  await docRef.set({
    username,
    passwordHash: hashPassword(password),
    role: 'super_admin',
    createdAt: nowIso,
    updatedAt: nowIso
  });

  console.log('[AdminAuth] Seeded default admin credentials in Firestore', {
    username,
    collection: config.adminAuth.collection
  });
}

async function verifyAdminCredential(username, password) {
  const normalizedUsername = String(username || '').trim();
  const normalizedPassword = String(password || '');

  if (!normalizedUsername || !normalizedPassword) {
    return null;
  }

  const collection = getCollection();
  const snapshot = await collection.doc(normalizedUsername).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() || {};
  const isValid = verifyPassword(normalizedPassword, data.passwordHash);

  if (!isValid) {
    return null;
  }

  return {
    username: data.username || normalizedUsername,
    role: data.role || 'admin'
  };
}

module.exports = {
  ensureDefaultAdminCredentials,
  verifyAdminCredential
};
