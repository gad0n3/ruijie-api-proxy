function createVoucherController({ voucherUseCases }) {
  return {
    async listActiveVouchers(req, res) {
      const data = await voucherUseCases.listActiveVouchers(
        req.bearerToken,
        req.query,
      );
      res.json(data);
    },

    async listRemainVouchers(req, res) {
      const data = await voucherUseCases.listRemainVouchers(
        req.bearerToken,
        req.query,
      );
      res.json(data);
    },

    async listExpiredVouchers(req, res) {
      const data = await voucherUseCases.listExpiredVouchers(
        req.bearerToken,
        req.query,
      );
      res.json(data);
    },

    async getVoucherStatus(req, res) {
      const data = await voucherUseCases.getVoucherStatus(
        req.bearerToken,
        req.query,
      );
      res.json(data);
    },

    async getVoucherPerformance(req, res) {
      const data = await voucherUseCases.getVoucherPerformance(
        req.bearerToken,
        req.query,
      );
      res.json(data);
    },

    async generateVoucher(req, res) {
      const data = await voucherUseCases.generateVoucher(
        req.bearerToken,
        req.body,
      );
      res.json(data);
    },

    async deleteExpiredVouchers(req, res) {
      const data = await voucherUseCases.deleteExpiredVouchers(
        req.bearerToken,
        req.query,
      );
      res.json(data);
    },

    async printUnusedVouchers(req, res) {
      const data = await voucherUseCases.printUnusedVouchers(
        req.bearerToken,
        req.body,
      );
      res.json(data);
    },
  };
}

module.exports = {
  createVoucherController,
};
