const { createAuthGateway } = require("./gateways/authGateway");
const {
  createAuthSessionRepository,
} = require("./repositories/sessionRepository");
const {
  createVipCredentialRepository,
} = require("./repositories/vipCredentialRepository");
const { createAuthUseCases } = require("./useCases/authUseCases");
const { createAuthController } = require("./controllers/authController");

/**
 * Creates the authentication module, wiring up its dependencies.
 * @param {object} dependencies - The dependencies for the auth module.
 * @param {object} dependencies.authGateway - The authentication gateway.
 * @param {object} dependencies.authSessionRepository - The session repository for auth.
 * @param {object} dependencies.vipCredentialRepository - The VIP credential repository.
 * @returns {object} The auth module with its use cases and controller.
 */
function createAuthModule({
  authGateway,
  authSessionRepository,
  vipCredentialRepository,
}) {
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
