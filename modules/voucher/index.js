const { createVoucherGateway } = require('./gateways/voucherGateway');
const { createVoucherUseCases } = require('./useCases/voucherUseCases');
const { createVoucherController } = require('./controllers/voucherController');
const { createVoucherSessionRepository } = require('./repositories/sessionRepository');

function createVoucherModule() {
  const voucherGateway = createVoucherGateway();
  const voucherSessionRepository = createVoucherSessionRepository();
  const voucherUseCases = createVoucherUseCases({ voucherGateway, voucherSessionRepository });
  const voucherController = createVoucherController({ voucherUseCases });

  return {
    voucherUseCases,
    voucherController
  };
}

module.exports = {
  createVoucherModule
};
