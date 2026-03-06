const { createAuthGateway } = require('./gateways/authGateway');
const { createSessionRepository } = require('./repositories/sessionRepository');
const { createVipCredentialRepository } = require('./repositories/vipCredentialRepository');
const { createAuthUseCases } = require('./useCases/authUseCases');
const { createAuthController } = require('./controllers/authController');

function createAuthModule() {
  const authGateway = createAuthGateway();
  const sessionRepository = createSessionRepository();
  const vipCredentialRepository = createVipCredentialRepository();
  const authUseCases = createAuthUseCases({
    authGateway,
    sessionRepository,
    vipCredentialRepository
  });
  const authController = createAuthController({ authUseCases });

  return {
    authUseCases,
    authController
  };
}

module.exports = {
  createAuthModule
};
