const { createAuthModule } = require('./auth');
const { createVoucherModule } = require('./voucher');
const { createPackageModule } = require('./package');
const { createClientModule } = require('./client');
const { createNetworkGroupModule } = require('./networkGroup');

function createAppDependencies() {
  const { authController } = createAuthModule();
  const { voucherController } = createVoucherModule();
  const { packageController } = createPackageModule();
  const { clientController } = createClientModule();
  const { networkGroupController } = createNetworkGroupModule();

  return {
    authController,
    voucherController,
    packageController,
    clientController,
    networkGroupController
  };
}

module.exports = {
  createAppDependencies
};
