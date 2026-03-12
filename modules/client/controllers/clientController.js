function createClientController({ clientUseCases }) {
  return {
    async listClients(req, res) {
      const data = await clientUseCases.listClients(req.bearerToken, req.query);
      res.json(data);
    },
  };
}

module.exports = {
  createClientController,
};
