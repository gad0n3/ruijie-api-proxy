const { resolveAuthenticatedSession } = require("../../../helpers/tokenParser");

function normalizeCurrentUserQuery(query) {
  const source = query && typeof query === "object" ? query : {};
  return {
    groupId: source.group_id || source.groupId,
    pageIndex: Number(source.page_index || source.pageIndex || 1),
    pageSize: Number(source.page_size || source.pageSize || 100),
  };
}

function validateCurrentUserQuery(query) {
  if (!query.groupId) {
    const error = new Error("groupId (or group_id) is required.");
    error.statusCode = 400;
    throw error;
  }
}

function formatMac(raw) {
  const hex = String(raw || "").replace(/[^a-fA-F0-9]/g, "");
  if (hex.length !== 12) {
    return String(raw || "").toUpperCase();
  }
  return hex.match(/.{2}/g).join(":").toUpperCase();
}

function mapClientRow(item) {
  return {
    mac: formatMac(item?.mac),
    staModel: item?.staModel || "",
    ip: item?.ip || "",
    duration: formatDuration(Number(item?.activeSec) || 0),
  };
}

function isAuthenticatedClient(item) {
  return Boolean(item?.authMac) || Boolean(item?.account);
}

function formatDuration(activeSec) {
  const totalSeconds = Number(activeSec) || 0;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

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

  const response = await clientGateway.getCurrentUserList(token, {
    accessToken,
    groupId: normalized.groupId,
    pageIndex: normalized.pageIndex,
    pageSize: normalized.pageSize,
  });

  const rawList = Array.isArray(response?.list) ? response.list : [];
  return rawList.filter(isAuthenticatedClient).map(mapClientRow);
}

function createClientUseCases({ clientGateway, clientSessionRepository }) {
  return {
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
