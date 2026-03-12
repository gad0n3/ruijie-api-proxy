const { getSessionByAppId } = require('../../../infrastructure/sessionStore');

function createNetworkGroupSessionRepository() {
  return {
    getByAppId(appid) {
      return getSessionByAppId(appid);
    }
  };
}

module.exports = {
  createNetworkGroupSessionRepository
};
