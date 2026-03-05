const { upstreamRequest } = require('../../../helpers/upstreamHttp');

function createNetworkGroupGateway() {
  return {
    getGroupTree(token, accessToken) {
      return upstreamRequest({
        method: 'GET',
        url: '/group/single/tree',
        token,
        params: {
          access_token: accessToken
        }
      });
    }
  };
}

module.exports = {
  createNetworkGroupGateway
};
