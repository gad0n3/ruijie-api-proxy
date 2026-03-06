function createClientController({ clientUseCases }) {
  return {
    async getAuthenticatedClients(req, res) {
      const data = await clientUseCases.getAuthenticatedClients(req.bearerToken, req.query);
      res.json(data);
    },

    async getUnauthenticatedClients(req, res) {
      const data = await clientUseCases.getUnauthenticatedClients(req.bearerToken, req.query);
      res.json(data);
    },

    async getSuspectedClients(req, res) {
      const data = await clientUseCases.getSuspectedClients(req.bearerToken, req.query);
      res.json(data);
    }
  };
}

module.exports = {
  createClientController
};
