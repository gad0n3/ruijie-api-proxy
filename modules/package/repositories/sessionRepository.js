const { getSessionByAppId } = require('../../../infrastructure/sessionStore');

function createPackageSessionRepository() {
  return {
    getByAppId(appid) {
      return getSessionByAppId(appid);
    }
  };
}

module.exports = {
  createPackageSessionRepository
};
