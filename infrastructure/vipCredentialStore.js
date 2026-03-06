const crypto = require('crypto');
const config = require('../config');
const { getFirestore } = require('../firebase/firebase');

function getCollection() {
  const db = getFirestore();

  if (!db) {
    throw new Error('Firestore is not initialized. Configure Firebase to use VIP credential mapping.');
  }

  return db.collection(config.vipAuth.collection);
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
  const actualHex = hashPassword(password, saltHex).split('$')[2];

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}

async function upsertVipCredential({ username, password, appid, secret }) {
  const normalizedUsername = String(username || '').trim();
  const normalizedAppId = String(appid || '').trim();
  const normalizedSecret = String(secret || '');

  if (!normalizedUsername || !password || !normalizedAppId || !normalizedSecret) {
    const error = new Error('username, password, appid, and secret are required');
    error.statusCode = 400;
    throw error;
  }

  const collection = getCollection();
  const docRef = collection.doc(normalizedUsername);
  const snapshot = await docRef.get();
  const nowIso = new Date().toISOString();

  const baseData = {
    username: normalizedUsername,
    appid: normalizedAppId,
    secret: normalizedSecret,
    passwordHash: hashPassword(password),
    updatedAt: nowIso
  };

  if (!snapshot.exists) {
    await docRef.set({
      ...baseData,
      createdAt: nowIso
    });
    return {
      action: 'created',
      username: normalizedUsername,
      appid: normalizedAppId,
      updatedAt: nowIso
    };
  }

  const existing = snapshot.data() || {};
  await docRef.set({
    ...existing,
    ...baseData,
    createdAt: existing.createdAt || nowIso
  });

  return {
    action: 'updated',
    username: normalizedUsername,
    appid: normalizedAppId,
    updatedAt: nowIso
  };
}

async function listVipCredentials(limit = 300) {
  const collection = getCollection();
  const snapshot = await collection.get();

  const rows = snapshot.docs.map((doc) => {
    const data = doc.data() || {};
    return {
      username: data.username || doc.id,
      appid: data.appid || '',
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || ''
    };
  });

  rows.sort((a, b) => Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0));
  return rows.slice(0, Number(limit) || 300);
}

async function deleteVipCredential(username) {
  const normalizedUsername = String(username || '').trim();

  if (!normalizedUsername) {
    const error = new Error('username is required');
    error.statusCode = 400;
    throw error;
  }

  const collection = getCollection();
  const docRef = collection.doc(normalizedUsername);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return {
      action: 'not_found',
      username: normalizedUsername
    };
  }

  await docRef.delete();

  return {
    action: 'deleted',
    username: normalizedUsername
  };
}

async function verifyVipCredential(username, password) {
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

  if (!verifyPassword(normalizedPassword, data.passwordHash)) {
    return null;
  }

  return {
    username: data.username || normalizedUsername,
    appid: data.appid,
    secret: data.secret
  };
}

module.exports = {
  upsertVipCredential,
  listVipCredentials,
  deleteVipCredential,
  verifyVipCredential
};
