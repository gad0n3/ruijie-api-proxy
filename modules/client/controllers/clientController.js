function createClientController({ clientUseCases }) {
  return {
    async getOnlineClients(req, res) {
      const data = await clientUseCases.getOnlineClients(req.bearerToken, req.query);
      res.json(data);
    },

    async setClientsOffline(req, res) {
      const data = await clientUseCases.setClientsOffline(req.bearerToken, req.body);
      res.json(data);
    },

    async getCurrentUsers(req, res) {
      const data = await clientUseCases.getCurrentUsers(req.bearerToken, req.query);
      res.json(data);
    }
  };
}

module.exports = {
  createClientController
};
