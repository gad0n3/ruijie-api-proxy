const { upstreamRequest } = require('../../../helpers/upstreamHttp');

function createClientGateway() {
  return {
    getOnlineClients(token, query) {
      return upstreamRequest({
        method: 'GET',
        url: '/clients/online',
        token,
        params: query
      });
    },

    setClientsOffline(token, payload) {
      return upstreamRequest({
        method: 'POST',
        url: '/clients/offline',
        token,
        data: payload
      });
    },

    getCurrentUsers(token, query) {
      return upstreamRequest({
        method: 'GET',
        url: '/clients/current-users',
        token,
        params: query
      });
    }
  };
}

module.exports = {
  createClientGateway
};
