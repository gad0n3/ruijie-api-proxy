const { getSessionByAppId } = require('../../../infrastructure/sessionStore');

function createClientSessionRepository() {
  return {
    getByAppId(appid) {
      return getSessionByAppId(appid);
    }
  };
}

module.exports = {
  createClientSessionRepository
};
