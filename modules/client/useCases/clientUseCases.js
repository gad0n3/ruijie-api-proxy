function createClientUseCases({ clientGateway }) {
  return {
    getOnlineClients(token, query) {
      return clientGateway.getOnlineClients(token, query);
    },

    setClientsOffline(token, payload) {
      return clientGateway.setClientsOffline(token, payload);
    },

    getCurrentUsers(token, query) {
      return clientGateway.getCurrentUsers(token, query);
    }
  };
}

module.exports = {
  createClientUseCases
};
