const { createClientGateway } = require('./gateways/clientGateway');
const { createClientSessionRepository } = require('./repositories/sessionRepository');
const { createClientUseCases } = require('./useCases/clientUseCases');
const { createClientController } = require('./controllers/clientController');

function createClientModule() {
  const clientGateway = createClientGateway();
  const clientSessionRepository = createClientSessionRepository();
  const clientUseCases = createClientUseCases({ clientGateway, clientSessionRepository });
  const clientController = createClientController({ clientUseCases });

  return {
    clientUseCases,
    clientController
  };
}

module.exports = {
  createClientModule
};
