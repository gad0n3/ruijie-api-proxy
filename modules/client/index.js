const { createClientGateway } = require('./gateways/clientGateway');
const { createClientUseCases } = require('./useCases/clientUseCases');
const { createClientController } = require('./controllers/clientController');

function createClientModule() {
  const clientGateway = createClientGateway();
  const clientUseCases = createClientUseCases({ clientGateway });
  const clientController = createClientController({ clientUseCases });

  return {
    clientUseCases,
    clientController
  };
}

module.exports = {
  createClientModule
};
