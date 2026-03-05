const { saveSessionByAppId } = require('../../../infrastructure/sessionStore');

function createSessionRepository() {
  return {
    saveByAppId(appid, payload) {
      return saveSessionByAppId(appid, payload);
    }
  };
}

module.exports = {
  createSessionRepository
};
