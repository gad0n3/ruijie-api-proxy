const { verifyVipCredential } = require('../../../infrastructure/vipCredentialStore');

function createVipCredentialRepository() {
  return {
    verify(username, password) {
      return verifyVipCredential(username, password);
    }
  };
}

module.exports = {
  createVipCredentialRepository
};
