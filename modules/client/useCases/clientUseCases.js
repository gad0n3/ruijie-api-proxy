function parseCompositeBearerToken(token) {
  if (!token || !token.includes('::')) {
    return null;
  }

  const parts = token.split('::');

  if (parts.length !== 2) {
    const error = new Error('Invalid bearer token format. Expected appid::token.');
    error.statusCode = 401;
    throw error;
  }

  const appid = parts[0].trim();
  const accessToken = parts[1].trim();

  if (!appid || !accessToken) {
    const error = new Error('Invalid bearer token format. Expected appid::token.');
    error.statusCode = 401;
    throw error;
  }

  return { appid, accessToken };
}

function normalizeCurrentUserQuery(query) {
  const source = query && typeof query === 'object' ? query : {};
  return {
    groupId: source.group_id || source.groupId,
    pageIndex: Number(source.page_index || source.pageIndex || 1),
    pageSize: Number(source.page_size || source.pageSize || 100)
  };
}

function validateCurrentUserQuery(query) {
  if (!query.groupId) {
    const error = new Error('groupId (or group_id) is required.');
    error.statusCode = 400;
    throw error;
  }
}

function mapCurrentUserRow(item) {
  const authMac = Boolean(item?.authMac);
  const accountValue = item?.account;
  const account = accountValue ? String(accountValue) : null;
  const activeSec = Number(item?.activeSec) || 0;

  return {
    mac: item?.mac || '',
    ip: item?.ip || '',
    userName: item?.userName || '',
    account,
    authMac,
    authStatus: authMac || Boolean(account) ? 'authenticated' : 'unauthenticated',
    duration: formatDuration(activeSec),
    onlineTime: item?.onlineTime || 0,
    deviceName: item?.deviceName || '',
    groupName: item?.groupName || '',
    flowUp: formatTrafficBytes(item?.flowUp),
    flowDown: formatTrafficBytes(item?.flowDown),
    flowUpDown: item?.flowUpDown || 0,
    upRate: item?.upRate || 0,
    downRate: item?.downRate || 0,
    activeSec,
    band: item?.band || '',
    rssi: item?.rssi || 0,
    pktLoseRate: item?.pktLoseRate || 0,
    channel: item?.channel || '',
    updateTime: item?.updateTime || 0,
    connectType: item?.connectType || '',
    clientSource: item?.clientSource || '',
    ssid: item?.ssid || '',
    manufacturerId: item?.manufacturerId || '',
    manufacturer: item?.manufacturer || '',
    staCategory: item?.staCategory || '',
    staLabel: item?.staLabel || '',
    staLabelName: item?.staLabelName || '',
    staModel: item?.staModel || '',
    isMlo: item?.isMlo || 0,
    mloBand: item?.mloBand || '',
    mloChan: item?.mloChan || '',
    mloRssi: item?.mloRssi || '',
    ipv6: item?.ipv6 || ''
  };
}

function formatTrafficBytes(value) {
  const bytes = Number(value) || 0;
  const oneMb = 1024 * 1024;
  const oneGb = 1024 * 1024 * 1024;

  if (bytes >= oneGb) {
    return `${(bytes / oneGb).toFixed(2)}-GB`;
  }

  return `${(bytes / oneMb).toFixed(2)}-MB`;
}

function formatDuration(activeSec) {
  const totalSeconds = Number(activeSec) || 0;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

async function fetchCurrentUsers({ clientGateway, clientSessionRepository, token, query }) {
  const normalized = normalizeCurrentUserQuery(query);
  validateCurrentUserQuery(normalized);

  const composite = parseCompositeBearerToken(token);

  if (!composite) {
    const error = new Error('Composite bearer token is required. Use Bearer appid::token.');
    error.statusCode = 401;
    throw error;
  }

  const session = await clientSessionRepository.getByAppId(composite.appid);

  if (!session) {
    const error = new Error('Session not found for provided appid. Please login again.');
    error.statusCode = 401;
    throw error;
  }

  if (session.access_token !== composite.accessToken) {
    const error = new Error('Bearer token is invalid or expired. Please login again.');
    error.statusCode = 401;
    throw error;
  }

  const response = await clientGateway.getCurrentUserList(token, {
    accessToken: composite.accessToken,
    groupId: normalized.groupId,
    pageIndex: normalized.pageIndex,
    pageSize: normalized.pageSize
  });

  const list = Array.isArray(response?.list) ? response.list : [];
  return list.map(mapCurrentUserRow);
}

function createClientUseCases({ clientGateway, clientSessionRepository }) {
  return {
    async getAuthenticatedClients(token, query) {
      const list = await fetchCurrentUsers({
        clientGateway,
        clientSessionRepository,
        token,
        query
      });

      return {
        list: list.filter((item) => item.authMac || Boolean(item.account))
      };
    },

    async getUnauthenticatedClients(token, query) {
      const list = await fetchCurrentUsers({
        clientGateway,
        clientSessionRepository,
        token,
        query
      });

      return {
        list: list.filter((item) => !item.authMac && !item.account)
      };
    },

    async getSuspectedClients(token, query) {
      const list = await fetchCurrentUsers({
        clientGateway,
        clientSessionRepository,
        token,
        query
      });

      const thresholdBytes = 20 * 1024 * 1024;

      return {
        list: list
          .filter((item) => !item.authMac && !item.account && Number(item.flowUpDown) > thresholdBytes)
          .map(({ flowUpDown, ...item }) => item)
      };
    }
  };
}

module.exports = {
  createClientUseCases
};
