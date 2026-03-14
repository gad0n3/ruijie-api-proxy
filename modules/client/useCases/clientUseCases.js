const { resolveAuthenticatedSession } = require("../../../helpers/tokenParser");
const { AuthenticationError } = require("../../../helpers/AppError");
const { validate, isRequired } = require("../../../helpers/validation");
const {
  formatMac,
  formatActiveDuration,
} = require("../../../helpers/formatter");
const logger = require("../../../helpers/logger");

/**
 * Normalizes query parameters for client listing requests.
 * @param {object} query - Raw query object.
 * @returns {object} Normalized query.
 */
function normalizeCurrentUserQuery(query) {
  const source = query && typeof query === "object" ? query : {};
  return {
    groupId: source.group_id || source.groupId,
    pageIndex: Number(source.page_index || source.pageIndex || 1),
    pageSize: Number(source.page_size || source.pageSize || 100),
  };
}

/**
 * Validates that required parameters for client listing are present.
 * @param {object} query - Normalized query object.
 */
function validateCurrentUserQuery(query) {
  validate(query, {
    groupId: [isRequired("groupId (or group_id) is required.")],
  });
}

/**
 * Maps a raw upstream client record to the standardized internal format.
 * @param {object} item - Raw client data.
 * @returns {object} Formatted client data.
 */
function mapClientRow(item) {
  // Combine manufacturer and model for a better display if both are available
  const model = item?.staModel || item?.userName || "Unknown Device";
  const manufacturer = item?.manufacturer || "";
  const displayModel =
    manufacturer && !model.startsWith(manufacturer)
      ? `${manufacturer} ${model}`
      : model;

  return {
    mac: formatMac(item?.mac),
    staModel: displayModel,
    ip: item?.ip || "",
    duration: formatActiveDuration(Number(item?.activeSec) || 0),
  };
}

/**
 * Determines if a client record represents an authenticated user.
 * @param {object} item - Raw client record.
 * @returns {boolean}
 */
function isAuthenticatedClient(item) {
  return Boolean(item?.authMac) || Boolean(item?.account);
}

/**
 * Orchestrates fetching current users, applying security context, and filtering/mapping results.
 * @private
 */
async function fetchCurrentUsers({
  clientGateway,
  clientSessionRepository,
  token,
  query,
}) {
  const normalized = normalizeCurrentUserQuery(query);
  validateCurrentUserQuery(normalized);

  const { session, accessToken } = await resolveAuthenticatedSession(
    token,
    clientSessionRepository,
  );

  if (!session.tenantName) {
    throw new AuthenticationError(
      "Session state is invalid. Please login again.",
    );
  }

  const response = await clientGateway.getCurrentUserList(token, {
    accessToken,
    groupId: normalized.groupId,
    pageIndex: normalized.pageIndex,
    pageSize: normalized.pageSize,
  });

  const rawList = Array.isArray(response?.list) ? response.list : [];

  // Show all connected clients to avoid "empty list" confusion, 
  // mapping them to the expected format.
  return rawList.map(mapClientRow);
}

/**
 * Factory for creating Client-related use cases.
 * @param {object} dependencies
 * @param {object} dependencies.clientGateway
 * @param {object} dependencies.clientSessionRepository
 */
function createClientUseCases({ clientGateway, clientSessionRepository }) {
  return {
    /**
     * Lists authenticated clients for a given network group.
     * @param {string} token - The bearer token.
     * @param {object} query - Request query parameters.
     * @returns {Promise<{ list: object[] }>}
     */
    async listClients(token, query) {
      const list = await fetchCurrentUsers({
        clientGateway,
        clientSessionRepository,
        token,
        query,
      });

      return { list };
    },
  };
}

module.exports = {
  createClientUseCases,
};
