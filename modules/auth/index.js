const { createAuthGateway } = require("./gateways/authGateway");
const {
  createAuthSessionRepository,
} = require("./repositories/sessionRepository");
const {
  createVipCredentialRepository,
} = require("./repositories/vipCredentialRepository");
const { createAuthUseCases } = require("./useCases/authUseCases");
const { createAuthController } = require("./controllers/authController");

function createAuthModule() {
  const authGateway = createAuthGateway();
  const authSessionRepository = createAuthSessionRepository();
  const vipCredentialRepository = createVipCredentialRepository();
  const authUseCases = createAuthUseCases({
    authGateway,
    sessionRepository: authSessionRepository,
    vipCredentialRepository,
  });
  const authController = createAuthController({ authUseCases });

  return {
    authUseCases,
    authController,
  };
}

module.exports = {
  createAuthModule,
};
