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

function validateCreatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    const error = new Error('Package payload is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.groupId) {
    const error = new Error('groupId is required in create package payload.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.name) {
    const error = new Error('name is required in create package payload.');
    error.statusCode = 400;
    throw error;
  }
}

function validateDeletePackageInput(uuid, query) {
  if (!query?.groupId) {
    const error = new Error('groupId is required in query for package delete.');
    error.statusCode = 400;
    throw error;
  }

  if (!query?.packageId) {
    const error = new Error('packageId is required in query for package delete.');
    error.statusCode = 400;
    throw error;
  }

  if (!uuid && !query?.authProfileId) {
    const error = new Error('authProfileId (or :uuid path param) is required for package delete.');
    error.statusCode = 400;
    throw error;
  }
}

function validateUpdatePackageInput(groupId, payload) {
  if (!groupId) {
    const error = new Error('groupId path param is required for package update.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload || typeof payload !== 'object') {
    const error = new Error('Package payload is required for update.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.id) {
    const error = new Error('id is required in update package payload.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.authProfileId && !payload.uuid) {
    const error = new Error('authProfileId or uuid is required in update package payload.');
    error.statusCode = 400;
    throw error;
  }
}

function validateListPackagesQuery(query) {
  if (!query?.groupId) {
    const error = new Error('groupId is required in query for packages list.');
    error.statusCode = 400;
    throw error;
  }
}

function validateListPackagesSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Get packages list failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function validateCreateAuthProfileSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Create auth profile failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(response?.voucherData?.msg || 'Create auth profile voucher data failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  const profileId = response?.voucherData?.data?.profileId;

  if (!profileId) {
    const error = new Error('Create auth profile succeeded without profileId.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  return profileId;
}

function validateCreateUserGroupSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Create user group failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  const firstRow = Array.isArray(response?.data) ? response.data[0] : null;

  if (!firstRow || !firstRow.id) {
    const error = new Error('Create user group succeeded without id.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  return firstRow;
}

function validateDeleteUserGroupSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Delete user group failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function validateDeleteAuthProfileSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Delete auth profile failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(response?.voucherData?.msg || 'Delete auth profile voucher data failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function validateUpdateAuthProfileSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Update auth profile failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(response?.voucherData?.msg || 'Update auth profile voucher data failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function validateUpdateUserGroupSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Update user group failed.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function mapCreatePackageResponse(payload, userGroupRow) {
  return {
    id: userGroupRow.id,
    noOfDevice: payload.noOfDevice,
    timePeriod: payload.timePeriod,
    quota: payload.quota,
    uploadRateLimit: payload.uploadRateLimit,
    downloadRateLimit: payload.downloadRateLimit,
    durationCtrlType: payload.durationCtrlType,
    timePeriodTotal: payload.timePeriodTotal,
    limitedTimes: payload.limitedTimes,
    price: payload.price,
    bindMac: payload.bindMac,
    kickOffType: payload.kickOffType,
    groupId: payload.groupId,
    name: payload.name
  };
}

function createPackageUseCases({ packageGateway, packageSessionRepository }) {
  return {
    async listPackages(token, query) {
      validateListPackagesQuery(query);

      const composite = parseCompositeBearerToken(token);

      if (!composite) {
        const error = new Error('Composite bearer token is required. Use Bearer appid::token.');
        error.statusCode = 401;
        throw error;
      }

      const session = await packageSessionRepository.getByAppId(composite.appid);

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

      const upstreamResponse = await packageGateway.listPackages(token, {
        groupId: query.groupId,
        pageIndex: typeof query.pageIndex === 'undefined' ? 0 : query.pageIndex,
        pageSize: typeof query.pageSize === 'undefined' ? 20 : query.pageSize,
        lang: query.lang || 'en',
        accessToken: composite.accessToken
      });

      validateListPackagesSuccess(upstreamResponse);

      return upstreamResponse;
    },

    async createPackage(token, payload) {
      validateCreatePayload(payload);

      const composite = parseCompositeBearerToken(token);

      if (!composite) {
        const error = new Error('Composite bearer token is required. Use Bearer appid::token.');
        error.statusCode = 401;
        throw error;
      }

      const session = await packageSessionRepository.getByAppId(composite.appid);

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

      const createProfileResponse = await packageGateway.createAuthProfile(token, {
        tenantName: session.tenantName,
        groupId: payload.groupId,
        tenantId: session.tenantId,
        lang: payload.lang,
        payload,
        accessToken: composite.accessToken
      });

      const profileId = validateCreateAuthProfileSuccess(createProfileResponse);

      const createUserGroupResponse = await packageGateway.createUserGroup(token, {
        groupId: payload.groupId,
        lang: payload.lang,
        accessToken: composite.accessToken,
        item: {
          ...payload,
          userGroupName: payload.userGroupName || payload.name,
          authProfileId: profileId
        }
      });

      const userGroupRow = validateCreateUserGroupSuccess(createUserGroupResponse);

      return mapCreatePackageResponse(payload, userGroupRow);
    },

    async updatePackageGroup(token, groupId, payload) {
      validateUpdatePackageInput(groupId, payload);

      const composite = parseCompositeBearerToken(token);

      if (!composite) {
        const error = new Error('Composite bearer token is required. Use Bearer appid::token.');
        error.statusCode = 401;
        throw error;
      }

      const session = await packageSessionRepository.getByAppId(composite.appid);

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

      const normalizedPayload = {
        ...payload,
        groupId: payload.groupId || Number(groupId),
        userGroupName: payload.userGroupName || payload.name,
        authProfileId: payload.authProfileId || payload.uuid
      };

      const updateAuthProfileResponse = await packageGateway.updateAuthProfile(token, {
        tenantName: session.tenantName,
        groupId,
        tenantId: session.tenantId,
        lang: payload.lang,
        payload: normalizedPayload,
        accessToken: composite.accessToken
      });

      validateUpdateAuthProfileSuccess(updateAuthProfileResponse);

      const updateUserGroupResponse = await packageGateway.updateUserGroup(token, {
        groupId,
        lang: payload.lang,
        payload: normalizedPayload,
        accessToken: composite.accessToken
      });

      validateUpdateUserGroupSuccess(updateUserGroupResponse);

      return {
        code: 0,
        msg: 'OK.'
      };
    },

    async deletePackage(token, uuid, query) {
      validateDeletePackageInput(uuid, query);

      const composite = parseCompositeBearerToken(token);

      if (!composite) {
        const error = new Error('Composite bearer token is required. Use Bearer appid::token.');
        error.statusCode = 401;
        throw error;
      }

      const session = await packageSessionRepository.getByAppId(composite.appid);

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

      if (!session.tenantId) {
        const error = new Error('tenantId is missing in session. Please login again.');
        error.statusCode = 401;
        throw error;
      }

      const deleteUserGroupResponse = await packageGateway.deleteUserGroup(token, {
        groupId: query.groupId,
        packageId: Number(query.packageId),
        lang: query.lang,
        accessToken: composite.accessToken
      });

      validateDeleteUserGroupSuccess(deleteUserGroupResponse);

      const authProfileId = query.authProfileId || uuid;

      const deleteAuthProfileResponse = await packageGateway.deleteAuthProfile(token, {
        authProfileId,
        tenantId: session.tenantId,
        groupId: query.groupId,
        lang: query.lang,
        accessToken: composite.accessToken
      });

      validateDeleteAuthProfileSuccess(deleteAuthProfileResponse);

      return {
        code: 0,
        msg: 'OK.'
      };
    }
  };
}

module.exports = {
  createPackageUseCases
};
