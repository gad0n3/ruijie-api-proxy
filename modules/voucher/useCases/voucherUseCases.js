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

function validateVoucherListQuery(query) {
  if (!query?.groupId) {
    const error = new Error('groupId is required in query for vouchers list.');
    error.statusCode = 400;
    throw error;
  }

  if (typeof query.status !== 'undefined' && !['1', '2', '3'].includes(String(query.status))) {
    const error = new Error('status must be one of 1 (Unused), 2 (Inuse), 3 (Expire).');
    error.statusCode = 400;
    throw error;
  }
}

function validateVoucherStatusQuery(query) {
  if (!query?.groupId) {
    const error = new Error('groupId is required in query for voucher status.');
    error.statusCode = 400;
    throw error;
  }
}

function validateVoucherListSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Get voucher list failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(response?.voucherData?.msg || 'Voucher data fetch failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function validateVoucherStatusSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Get voucher status failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(response?.voucherData?.msg || 'Voucher status fetch failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function formatSpeed(rateLimit) {
  const value = Number(rateLimit) || 0;

  if (value <= 0) {
    return '0Mbps';
  }

  const mbps = value / 1024;

  if (Number.isInteger(mbps)) {
    return `${mbps}Mbps`;
  }

  return `${mbps.toFixed(2)}Mbps`;
}

function formatDuration(timePeriod) {
  const minutes = Number(timePeriod) || 0;

  if (minutes === 0) {
    return 'Unlimited';
  }

  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  return `${minutes} min`;
}

function mapVoucher(item) {
  const packagePrice = Number(item?.packagePrice) || 0;

  return {
    voucherCode: item?.voucherCode || '',
    timePeriod: Number(item?.timePeriod) || 0,
    maxClients: Number(item?.maxClients) || 0,
    status: String(item?.status || ''),
    packagePrice,
    bindMac: Number(item?.bindMac) || 0,
    packageName: item?.packageName || '',
    userGroupId: String(item?.userGroupId || ''),
    disableStatus: Number(item?.disableStatus) || 0,
    price: `${packagePrice}ကျပ်`,
    dl_speed: formatSpeed(item?.downloadRateLimit),
    ul_speed: formatSpeed(item?.uploadRateLimit),
    duration: formatDuration(item?.timePeriod)
  };
}

function mapGeneratedVoucher(item) {
  return {
    uuid: item?.uuid || '',
    voucherCode: item?.codeNo || '',
    status: String(item?.status || ''),
    profileId: item?.profileId || '',
    expiryTime: item?.expiryTime || ''
  };
}

function mapVoucherStatus(voucherData) {
  return {
    expired: Number(voucherData?.expired) || 0,
    total: Number(voucherData?.total) || 0,
    used: Number(voucherData?.used) || 0
  };
}

function validateDeleteExpiredInput(query, payload) {
  if (!query?.groupId) {
    const error = new Error('groupId is required in query for deleting vouchers.');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    const error = new Error('Request body must be a non-empty array of vouchers.');
    error.statusCode = 400;
    throw error;
  }
}

function validateGenerateVoucherInput(payload) {
  if (!payload || typeof payload !== 'object') {
    const error = new Error('Voucher payload is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.groupId) {
    const error = new Error('groupId is required in voucher payload.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.userGroupId) {
    const error = new Error('userGroupId is required in voucher payload.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.profile && !payload.authProfileId) {
    const error = new Error('profile (or authProfileId) is required in voucher payload.');
    error.statusCode = 400;
    throw error;
  }
}

function validateGenerateVoucherSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Create voucher failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(response?.voucherData?.msg || 'Create voucher voucherData failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function validateDeleteBatchResponse(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Delete voucher batch failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(response?.voucherData?.msg || 'Delete voucher batch voucherData failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function chunkArray(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function normalizeDeleteRow(item) {
  const uuid = String(item?.uuid || '').trim();
  const voucherCode = String(item?.voucherCode || '').trim();

  if (!uuid || !voucherCode) {
    const error = new Error('Each voucher item must include uuid and voucherCode.');
    error.statusCode = 400;
    throw error;
  }

  return {
    uuid,
    voucherCode
  };
}

function createVoucherUseCases({ voucherGateway, voucherSessionRepository }) {
  return {
    async listVouchers(token, query) {
      validateVoucherListQuery(query);

      const composite = parseCompositeBearerToken(token);

      if (!composite) {
        const error = new Error('Composite bearer token is required. Use Bearer appid::token.');
        error.statusCode = 401;
        throw error;
      }

      const session = await voucherSessionRepository.getByAppId(composite.appid);

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

      if (!session.tenantName) {
        const error = new Error('tenantName is missing in session. Please login again.');
        error.statusCode = 401;
        throw error;
      }

      const upstreamResponse = await voucherGateway.listVouchers(token, {
        tenantName: session.tenantName,
        groupId: query.groupId,
        start: typeof query.start === 'undefined' ? 0 : query.start,
        pageSize: typeof query.pageSize === 'undefined' ? 100 : query.pageSize,
        status: typeof query.status === 'undefined' ? 1 : query.status,
        lang: query.lang || 'en',
        accessToken: composite.accessToken
      });

      validateVoucherListSuccess(upstreamResponse);

      const list = Array.isArray(upstreamResponse?.voucherData?.list)
        ? upstreamResponse.voucherData.list
        : [];

      return list.map(mapVoucher);
    },

    async getVoucherStatus(token, query) {
      validateVoucherStatusQuery(query);

      const composite = parseCompositeBearerToken(token);

      if (!composite) {
        const error = new Error('Composite bearer token is required. Use Bearer appid::token.');
        error.statusCode = 401;
        throw error;
      }

      const session = await voucherSessionRepository.getByAppId(composite.appid);

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

      if (!session.tenantName || !session.tenantId) {
        const error = new Error('tenantName and tenantId are missing in session. Please login again.');
        error.statusCode = 401;
        throw error;
      }

      const upstreamResponse = await voucherGateway.getVoucherStatus(token, {
        tenantName: session.tenantName,
        groupId: query.groupId,
        tenantId: session.tenantId,
        accessToken: composite.accessToken
      });

      validateVoucherStatusSuccess(upstreamResponse);

      return mapVoucherStatus(upstreamResponse?.voucherData);
    },

    async generateVoucher(token, payload) {
      validateGenerateVoucherInput(payload);

      const composite = parseCompositeBearerToken(token);

      if (!composite) {
        const error = new Error('Composite bearer token is required. Use Bearer appid::token.');
        error.statusCode = 401;
        throw error;
      }

      const session = await voucherSessionRepository.getByAppId(composite.appid);

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

      if (!session.tenantName) {
        const error = new Error('tenantName is missing in session. Please login again.');
        error.statusCode = 401;
        throw error;
      }

      const quantity = String(
        typeof payload.quantity !== 'undefined'
          ? payload.quantity
          : (typeof payload.count !== 'undefined' ? payload.count : 1)
      );

      const upstreamPayload = {
        createCodeType: String(payload.createCodeType || '1'),
        codeSize: Number(payload.codeSize || 9),
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        email: payload.email || '',
        phone: payload.phone || '',
        comment: payload.comment || '',
        quantity,
        userGroupId: Number(payload.userGroupId),
        profile: String(payload.profile || payload.authProfileId)
      };

      const response = await voucherGateway.generateVoucher(token, {
        tenantName: session.tenantName,
        groupId: payload.groupId,
        lang: payload.lang || 'en',
        accessToken: composite.accessToken,
        payload: upstreamPayload
      });

      validateGenerateVoucherSuccess(response);

      const list = Array.isArray(response?.voucherData?.list)
        ? response.voucherData.list
        : [];

      return {
        count: Number(response?.voucherData?.count) || list.length,
        list: list.map(mapGeneratedVoucher)
      };
    },

    async deleteExpiredVouchers(token, query, payload) {
      validateDeleteExpiredInput(query, payload);

      const composite = parseCompositeBearerToken(token);

      if (!composite) {
        const error = new Error('Composite bearer token is required. Use Bearer appid::token.');
        error.statusCode = 401;
        throw error;
      }

      const rows = payload.map(normalizeDeleteRow);
      const batches = chunkArray(rows, 100);

      for (const batch of batches) {
        const ids = batch.map((item) => item.uuid).join(',');
        const list = batch.map((item) => ({ voucherCode: item.voucherCode }));

        const response = await voucherGateway.deleteVoucherBatch(token, {
          ids,
          groupId: query.groupId,
          lang: query.lang || 'en',
          accessToken: composite.accessToken,
          list
        });

        validateDeleteBatchResponse(response);
      }

      return {
        code: 0,
        msg: 'Success.',
        deletedCount: rows.length,
        batchCount: batches.length
      };
    }
  };
}

module.exports = {
  createVoucherUseCases
};
