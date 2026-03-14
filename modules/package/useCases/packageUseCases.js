const { resolveAuthenticatedSession } = require("../../../helpers/tokenParser");
const {
  ValidationError,
  AuthenticationError,
  UpstreamError,
} = require("../../../helpers/AppError");
const {
  validate,
  isRequired,
  isObject,
  oneOf,
} = require("../../../helpers/validation");

/**
 * Validates the payload for creating a new package.
 * @param {object} payload - The request body.
 */
function validateCreatePayload(payload) {
  validate(payload, {
    groupId: [isRequired("groupId is required in create package payload.")],
    name: [isRequired("name is required in create package payload.")],
  });
}

/**
 * Validates the input for deleting a package.
 * @param {string} uuid - The package UUID from path.
 * @param {object} query - The request query parameters.
 */
function validateDeletePackageInput(uuid, query) {
  validate(
    { uuid, ...query },
    {
      groupId: [isRequired("groupId is required in query for package delete.")],
      packageId: [
        isRequired("packageId is required in query for package delete."),
      ],
      _crossFieldValidators: [
        oneOf(
          ["uuid", "authProfileId"],
          "authProfileId (or :uuid path param) is required for package delete.",
        ),
      ],
    },
  );
}

/**
 * Validates the input for updating a package.
 * @param {string} groupId - The group ID from path.
 * @param {object} payload - The request body.
 */
function validateUpdatePackageInput(groupId, payload) {
  validate(
    { groupId, ...payload },
    {
      groupId: [
        isRequired("groupId path param is required for package update."),
      ],
      id: [isRequired("id is required in update package payload.")],
      _crossFieldValidators: [
        oneOf(
          ["authProfileId", "uuid"],
          "authProfileId or uuid is required in update package payload.",
        ),
      ],
    },
  );
}

/**
 * Validates the query parameters for listing packages.
 * @param {object} query - The request query parameters.
 */
function validateListPackagesQuery(query) {
  validate(query, {
    groupId: [isRequired("groupId is required in query for packages list.")],
  });
}

/**
 * Validates the upstream response for a package list request.
 * @param {object} response - Upstream response.
 */
function validateListPackagesSuccess(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Get packages list failed.",
      502,
      response,
    );
  }

  // voucherData might be present if the usergroups are synced with SAM profiles
  if (response?.voucherData && Number(response.voucherData.code) !== 0) {
    throw new UpstreamError(
      response.voucherData.msg || "Get packages list voucher info failed.",
      502,
      response,
    );
  }
}

/**
 * Maps a raw upstream user group to the standardized package format.
 * @param {object} item - Raw user group item.
 * @returns {object} Formatted package object.
 */
function mapPackage(item) {
  const price = item.price || 0;
  return {
    id: item.id || 0,
    name: item.userGroupName || item.name || "",
    userGroupName: item.userGroupName || item.name || "",
    authProfileId: item.authProfileId || "",
    price,
    price_label: `${price}ကျပ်`,
    speed: item.downloadRateLimit || 0,
    timePeriod: item.timePeriod || item.timePeriodDaily || 0,
    noOfDevice: item.noOfDevice || 1,
  };
}

/**
 * Validates the upstream response for creating an auth profile.
 * @param {object} response - Upstream response.
 */
function validateCreateAuthProfileSuccess(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Create auth profile failed.",
      502,
      response,
    );
  }

  if (Number(response?.voucherData?.code) !== 0) {
    throw new UpstreamError(
      response?.voucherData?.msg || "Create auth profile voucher data failed.",
      502,
      response,
    );
  }

  const profileId = response?.voucherData?.data?.profileId;
  if (!profileId) {
    throw new UpstreamError(
      "Create auth profile succeeded without profileId.",
      502,
      response,
    );
  }
  return profileId;
}

/**
 * Validates the upstream response for creating a user group.
 * @param {object} response - Upstream response.
 */
function validateCreateUserGroupSuccess(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Create user group failed.",
      502,
      response,
    );
  }

  const firstRow = Array.isArray(response?.data) ? response.data[0] : null;
  if (!firstRow || !firstRow.id) {
    throw new UpstreamError(
      "Create user group succeeded without id.",
      502,
      response,
    );
  }
  return firstRow;
}

/**
 * Validates the upstream response for deleting a user group.
 * @param {object} response - Upstream response.
 */
function validateDeleteUserGroupSuccess(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Delete user group failed.",
      502,
      response,
    );
  }
}

/**
 * Validates the upstream response for deleting an auth profile.
 * @param {object} response - Upstream response.
 */
function validateDeleteAuthProfileSuccess(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Delete auth profile failed.",
      502,
      response,
    );
  }
  if (Number(response?.voucherData?.code) !== 0) {
    throw new UpstreamError(
      response?.voucherData?.msg || "Delete auth profile voucher data failed.",
      502,
      response,
    );
  }
}

/**
 * Validates the upstream response for updating an auth profile.
 * @param {object} response - Upstream response.
 */
function validateUpdateAuthProfileSuccess(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Update auth profile failed.",
      502,
      response,
    );
  }

  if (Number(response?.voucherData?.code) !== 0) {
    throw new UpstreamError(
      response?.voucherData?.msg || "Update auth profile voucher data failed.",
      502,
      response,
    );
  }
}

/**
 * Validates the upstream response for updating a user group.
 * @param {object} response - Upstream response.
 */
function validateUpdateUserGroupSuccess(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Update user group failed.",
      502,
      response,
    );
  }
}

/**
 * Maps the package creation result to a consistent response format.
 */
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
    name: payload.name,
  };
}

/**
 * Factory for creating package use cases.
 */
function createPackageUseCases({ packageGateway, packageSessionRepository }) {
  return {
    /**
     * Lists all packages for a specific group.
     */
    async listPackages(token, query) {
      validateListPackagesQuery(query);

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        packageSessionRepository,
      );

      const upstreamResponse = await packageGateway.listPackages(token, {
        groupId: query.groupId,
        pageIndex: 1,
        pageSize: 100, // Increased page size to get all packages
        lang: query.lang || "en",
        accessToken,
      });

      validateListPackagesSuccess(upstreamResponse);

      const list = Array.isArray(upstreamResponse?.data)
        ? upstreamResponse.data
        : [];

      return list.map(mapPackage);
    },

    /**
     * Creates a new package (Auth Profile + User Group).
     */
    async createPackage(token, payload) {
      validateCreatePayload(payload);

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        packageSessionRepository,
      );

      if (!session.tenantName || !session.tenantId) {
        throw new AuthenticationError(
          "tenantName and tenantId are missing in session. Please login again.",
        );
      }

      const createProfileResponse = await packageGateway.createAuthProfile(
        token,
        {
          tenantName: session.tenantName,
          groupId: payload.groupId,
          tenantId: session.tenantId,
          lang: payload.lang,
          payload,
          accessToken,
        },
      );

      const profileId = validateCreateAuthProfileSuccess(createProfileResponse);

      const createUserGroupResponse = await packageGateway.createUserGroup(
        token,
        {
          groupId: payload.groupId,
          lang: payload.lang,
          accessToken,
          item: {
            ...payload,
            userGroupName: payload.userGroupName || payload.name,
            authProfileId: profileId,
          },
        },
      );

      const userGroupRow = validateCreateUserGroupSuccess(
        createUserGroupResponse,
      );

      return mapCreatePackageResponse(payload, userGroupRow);
    },

    /**
     * Updates an existing package group.
     */
    async updatePackageGroup(token, groupId, payload) {
      validateUpdatePackageInput(groupId, payload);

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        packageSessionRepository,
      );

      if (!session.tenantName || !session.tenantId) {
        throw new AuthenticationError(
          "tenantName and tenantId are missing in session. Please login again.",
        );
      }

      const normalizedPayload = {
        ...payload,
        groupId: payload.groupId || Number(groupId),
        userGroupName: payload.userGroupName || payload.name,
        authProfileId: payload.authProfileId || payload.uuid,
      };

      const updateAuthProfileResponse = await packageGateway.updateAuthProfile(
        token,
        {
          tenantName: session.tenantName,
          groupId,
          tenantId: session.tenantId,
          lang: payload.lang,
          payload: normalizedPayload,
          accessToken,
        },
      );

      validateUpdateAuthProfileSuccess(updateAuthProfileResponse);

      const updateUserGroupResponse = await packageGateway.updateUserGroup(
        token,
        {
          groupId,
          lang: payload.lang,
          payload: normalizedPayload,
          accessToken,
        },
      );

      validateUpdateUserGroupSuccess(updateUserGroupResponse);

      return {
        code: 0,
        msg: "OK.",
      };
    },

    /**
     * Deletes a package (User Group + Auth Profile).
     */
    async deletePackage(token, uuid, query) {
      validateDeletePackageInput(uuid, query);

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        packageSessionRepository,
      );

      if (!session.tenantId) {
        throw new AuthenticationError(
          "tenantId is missing in session. Please login again.",
        );
      }

      const deleteUserGroupResponse = await packageGateway.deleteUserGroup(
        token,
        {
          groupId: query.groupId,
          packageId: Number(query.packageId),
          lang: query.lang,
          accessToken,
        },
      );

      validateDeleteUserGroupSuccess(deleteUserGroupResponse);

      const authProfileId = query.authProfileId || uuid;

      const deleteAuthProfileResponse = await packageGateway.deleteAuthProfile(
        token,
        {
          authProfileId,
          tenantId: session.tenantId,
          groupId: query.groupId,
          lang: query.lang,
          accessToken,
        },
      );

      validateDeleteAuthProfileSuccess(deleteAuthProfileResponse);

      return {
        code: 0,
        msg: "OK.",
      };
    },
  };
}

module.exports = {
  createPackageUseCases,
};
