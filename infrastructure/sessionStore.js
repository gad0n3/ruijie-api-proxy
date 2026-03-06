const config = require('../config');
const { getFirestore } = require('../firebase/firebase');

function getCollection() {
  const db = getFirestore();

  if (!db) {
    const error = new Error('Firebase is not initialized. Configure Firebase credentials to use login sessions.');
    error.statusCode = 500;
    throw error;
  }

  return db.collection(config.firebaseSessionCollection);
}

async function saveSessionByAppId(appid, payload) {
  if (!appid) {
    const error = new Error('appid is required to save session.');
    error.statusCode = 400;
    throw error;
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
    updatedAt: nowIso
  });
}

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

async function listSessions(limit = 200) {
  const collection = getCollection();
  const snapshot = await collection.get();

  const rows = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
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
}

module.exports = {
  saveSessionByAppId,
  getSessionByAppId,
  listSessions
};
