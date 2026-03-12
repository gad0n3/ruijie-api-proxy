const { saveSessionByAppId } = require("../../../infrastructure/sessionStore");

function createAuthSessionRepository() {
  return {
    saveByAppId(appid, payload) {
      return saveSessionByAppId(appid, payload);
    },
  };
}

module.exports = {
  createAuthSessionRepository,
};
