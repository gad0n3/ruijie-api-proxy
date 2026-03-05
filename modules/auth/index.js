const { createAuthGateway } = require('./gateways/authGateway');
const { createSessionRepository } = require('./repositories/sessionRepository');
const { createAuthUseCases } = require('./useCases/authUseCases');
const { createAuthController } = require('./controllers/authController');

function createAuthModule() {
  const authGateway = createAuthGateway();
  const sessionRepository = createSessionRepository();
  const authUseCases = createAuthUseCases({ authGateway, sessionRepository });
  const authController = createAuthController({ authUseCases });

  return {
    authUseCases,
    authController
  };
}

module.exports = {
  createAuthModule
};
