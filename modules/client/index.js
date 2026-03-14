const { createClientGateway } = require("./gateways/clientGateway");
const {
  createClientSessionRepository,
} = require("./repositories/sessionRepository");
const { createClientUseCases } = require("./useCases/clientUseCases");
const { createClientController } = require("./controllers/clientController");

/**
 * Creates the client module, wiring up its dependencies.
 * @param {object} dependencies - The dependencies for the client module.
 * @param {object} dependencies.clientGateway - The client gateway.
 * @param {object} dependencies.clientSessionRepository - The session repository for clients.
 * @returns {object} The client module with its use cases and controller.
 */
function createClientModule({ clientGateway, clientSessionRepository }) {
  const clientUseCases = createClientUseCases({
    clientGateway,
    clientSessionRepository,
  });
  const clientController = createClientController({ clientUseCases });

  return {
    clientUseCases,
    clientController,
  };
}

module.exports = {
  createClientModule,
};
