const { createVoucherGateway } = require("./gateways/voucherGateway");
const { createVoucherUseCases } = require("./useCases/voucherUseCases");
const { createVoucherController } = require("./controllers/voucherController");
const {
  createVoucherSessionRepository,
} = require("./repositories/sessionRepository");

/**
 * Creates the voucher module, wiring up its dependencies.
 * @param {object} dependencies - The dependencies for the voucher module.
 * @param {object} dependencies.voucherGateway - The voucher gateway.
 * @param {object} dependencies.voucherSessionRepository - The session repository for vouchers.
 * @returns {object} The voucher module with its use cases and controller.
 */
function createVoucherModule({ voucherGateway, voucherSessionRepository }) {
  const voucherUseCases = createVoucherUseCases({
    voucherGateway,
    voucherSessionRepository,
  });
  const voucherController = createVoucherController({ voucherUseCases });

  return {
    voucherUseCases,
    voucherController,
  };
}

module.exports = {
  createVoucherModule,
};
