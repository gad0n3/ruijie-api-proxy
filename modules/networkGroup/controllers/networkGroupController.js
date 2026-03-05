function createNetworkGroupController({ networkGroupUseCases }) {
  return {
    async listNetworkGroups(req, res) {
      const data = await networkGroupUseCases.listNetworkGroups(req.bearerToken);
      res.json(data);
    }
  };
}

module.exports = {
  createNetworkGroupController
};
