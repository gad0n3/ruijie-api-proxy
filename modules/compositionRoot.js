const { createAuthModule } = require("./auth");
const { createVoucherModule } = require("./voucher");
const { createPackageModule } = require("./package");
const { createClientModule } = require("./client");
const { createNetworkGroupModule } = require("./networkGroup");

// --- Gateways ---
const { createAuthGateway } = require("./auth/gateways/authGateway");
const { createVoucherGateway } = require("./voucher/gateways/voucherGateway");
const { createPackageGateway } = require("./package/gateways/packageGateway");
const { createClientGateway } = require("./client/gateways/clientGateway");
const {
  createNetworkGroupGateway,
} = require("./networkGroup/gateways/networkGroupGateway");

// --- Repositories ---
const { createSessionRepository } = require("../infrastructure/sessionStore"); // General session repository
const {
  createVipCredentialRepository,
} = require("./auth/repositories/vipCredentialRepository");
const {
  createVoucherSessionRepository,
} = require("./voucher/repositories/sessionRepository");
const {
  createPackageSessionRepository,
} = require("./package/repositories/sessionRepository");
const {
  createClientSessionRepository,
} = require("./client/repositories/sessionRepository");
const {
  createNetworkGroupSessionRepository,
} = require("./networkGroup/repositories/sessionRepository");

function createAppDependencies() {
  // --- Auth Module Dependencies ---
  const authGateway = createAuthGateway();
  const authSessionRepository = createSessionRepository(); // Reusing the general session repository
  const vipCredentialRepository = createVipCredentialRepository();

  const { authController } = createAuthModule({
    authGateway,
    authSessionRepository,
    vipCredentialRepository,
  });

  // --- Voucher Module Dependencies ---
  const voucherGateway = createVoucherGateway();
  const voucherSessionRepository = createVoucherSessionRepository(); // Specific for voucher module

  const { voucherController } = createVoucherModule({
    voucherGateway,
    voucherSessionRepository,
  });

  // --- Package Module Dependencies ---
  const packageGateway = createPackageGateway();
  const packageSessionRepository = createPackageSessionRepository(); // Specific for package module

  const { packageController } = createPackageModule({
    packageGateway,
    packageSessionRepository,
  });

  // --- Client Module Dependencies ---
  const clientGateway = createClientGateway();
  const clientSessionRepository = createClientSessionRepository(); // Specific for client module

  const { clientController } = createClientModule({
    clientGateway,
    clientSessionRepository,
  });

  // --- Network Group Module Dependencies ---
  const networkGroupGateway = createNetworkGroupGateway();
  const networkGroupSessionRepository = createNetworkGroupSessionRepository(); // Specific for network group module

  const { networkGroupController } = createNetworkGroupModule({
    networkGroupGateway,
    networkGroupSessionRepository,
  });

  return {
    authController,
    voucherController,
    packageController,
    clientController,
    networkGroupController,
  };
}

module.exports = {
  createAppDependencies,
};
