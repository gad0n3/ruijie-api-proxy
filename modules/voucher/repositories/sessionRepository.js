const { getSessionByAppId } = require('../../../infrastructure/sessionStore');

function createVoucherSessionRepository() {
  return {
    getByAppId(appid) {
      return getSessionByAppId(appid);
    }
  };
}

module.exports = {
  createVoucherSessionRepository
};
