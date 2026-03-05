function createVoucherController({ voucherUseCases }) {
  return {
    async listVouchers(req, res) {
      const data = await voucherUseCases.listVouchers(req.bearerToken, req.query);
      res.json(data);
    },

    async generateVoucher(req, res) {
      const data = await voucherUseCases.generateVoucher(req.bearerToken, req.body);
      res.json(data);
    },

    async deleteExpiredVouchers(req, res) {
      const data = await voucherUseCases.deleteExpiredVouchers(req.bearerToken, req.query, req.body);
      res.json(data);
    }
  };
}

module.exports = {
  createVoucherController
};
