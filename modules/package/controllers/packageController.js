function createPackageController({ packageUseCases }) {
  return {
    async listPackages(req, res) {
      const data = await packageUseCases.listPackages(req.bearerToken, req.query);
      res.json(data);
    },

    async createPackage(req, res) {
      const data = await packageUseCases.createPackage(req.bearerToken, req.body);
      res.json(data);
    },

    async updatePackageGroup(req, res) {
      const data = await packageUseCases.updatePackageGroup(req.bearerToken, req.params.groupId, req.body);
      res.json(data);
    },

    async deletePackage(req, res) {
      const data = await packageUseCases.deletePackage(req.bearerToken, req.params.uuid, req.query);
      res.json(data);
    }
  };
}

module.exports = {
  createPackageController
};
