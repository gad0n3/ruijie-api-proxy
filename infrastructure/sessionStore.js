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
  await collection.doc(String(appid)).set(payload);
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

module.exports = {
  saveSessionByAppId,
  getSessionByAppId
};
