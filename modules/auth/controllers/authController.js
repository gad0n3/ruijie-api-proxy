function createAuthController({ authUseCases }) {
  return {
    async login(req, res) {
      const data = await authUseCases.login(req.body);
      res.json(data);
    },

    async getProjects(req, res) {
      const data = await authUseCases.getProjects(req.bearerToken);
      res.json(data);
    },

    async getTenant(req, res) {
      const data = await authUseCases.getTenant(req.bearerToken);
      res.json(data);
    }
  };
}

module.exports = {
  createAuthController
};
