const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const config = require('../config');

let firebaseApp = null;

function getServiceAccount() {
  if (config.firebase.serviceAccountPath) {
    const serviceAccountAbsolutePath = path.resolve(config.firebase.serviceAccountPath);
    const fileContent = fs.readFileSync(serviceAccountAbsolutePath, 'utf8');
    return JSON.parse(fileContent);
  }

  if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
    return {
      project_id: config.firebase.projectId,
      client_email: config.firebase.clientEmail,
      private_key: config.firebase.privateKey.replace(/\\n/g, '\n')
    };
  }

  return null;
}

function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  return firebaseApp;
}

function getFirestore() {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    return null;
  }

  return admin.firestore(firebaseApp);
}

module.exports = {
  initializeFirebase,
  getFirestore,
  admin
};
