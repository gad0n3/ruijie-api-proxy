const { upstreamRequest } = require("../../../helpers/upstreamHttp");

/**
 * @typedef {object} PackageGateway
 * @property {(token: string, query: { groupId: string; pageIndex: number; pageSize: number; lang?: string; accessToken: string }) => Promise<object>} listPackages - Lists packages (user groups) from the upstream API.
 * @property {(token: string, payload: object) => Promise<object>} createPackage - Creates a package (deprecated, handled by createAuthProfile and createUserGroup).
 * @property {(token: string, options: { tenantName: string; groupId: string; tenantId: string; lang?: string; payload: object; accessToken: string }) => Promise<object>} createAuthProfile - Creates an authentication profile in the upstream API.
 * @property {(token: string, options: { groupId: string; lang?: string; item: object; accessToken: string }) => Promise<object>} createUserGroup - Creates a user group (package) in the upstream API.
 * @property {(token: string, options: { tenantName: string; groupId: string; tenantId: string; lang?: string; payload: object; accessToken: string }) => Promise<object>} updateAuthProfile - Updates an authentication profile in the upstream API.
 * @property {(token: string, options: { groupId: string; lang?: string; payload: object; accessToken: string }) => Promise<object>} updateUserGroup - Updates a user group (package) in the upstream API.
 * @property {(token: string, groupId: string, payload: object) => Promise<object>} updatePackageGroup - Updates a package group (deprecated, handled by updateAuthProfile and updateUserGroup).
 * @property {(token: string, uuid: string) => Promise<object>} deletePackage - Deletes a package (deprecated, handled by deleteUserGroup and deleteAuthProfile).
 * @property {(token: string, options: { groupId: string; packageId: number; lang?: string; accessToken: string }) => Promise<object>} deleteUserGroup - Deletes a user group (package) from the upstream API.
 * @property {(token: string, options: { authProfileId: string; tenantId: string; groupId: string; lang?: string; accessToken: string }) => Promise<object>} deleteAuthProfile - Deletes an authentication profile from the upstream API.
 */

/**
 * Creates a package gateway for interacting with the Ruijie upstream package and user group APIs.
 * @returns {PackageGateway} An object implementing the PackageGateway interface.
 */
function createPackageGateway() {
  return {
    /**
     * Lists packages (which correspond to user groups) from the upstream API.
     * @param {string} token - The bearer token for authentication.
     * @param {object} query - Query parameters for listing packages.
     * @param {string} query.groupId - The ID of the group to list packages from.
     * @param {number} query.pageIndex - The page index for pagination.
     * @param {number} query.pageSize - The number of items per page.
     * @param {string} [query.lang='en'] - The language for the response.
     * @param {string} query.accessToken - The access token.
     * @returns {Promise<object>} The upstream response containing the list of packages.
     */
    listPackages(token, { groupId, pageIndex, pageSize, lang, accessToken }) {
      return upstreamRequest({
        method: "GET",
        url: `/intl/usergroup/list/${groupId}`,
        token,
        params: {
          pageIndex,
          pageSize,
          lang,
          access_token: accessToken,
        },
      });
    },

    /**
     * Creates a new package in the upstream API.
     * NOTE: This method is likely deprecated or part of a two-step process (createAuthProfile, createUserGroup).
     * @param {string} token - The bearer token for authentication.
     * @param {object} payload - The package creation payload.
     * @returns {Promise<object>} The upstream response for package creation.
     */
    createPackage(token, payload) {
      return upstreamRequest({
        method: "POST",
        url: "/packages/create",
        token,
        data: payload,
      });
    },

    /**
     * Creates an authentication profile in the upstream API. This is usually the first step
     * when creating a new package that requires an auth profile.
     * @param {string} token - The bearer token for authentication.
     * @param {object} options - Options for creating the auth profile.
     * @param {string} options.tenantName - The tenant name.
     * @param {string} options.groupId - The group ID.
     * @param {string} options.tenantId - The tenant ID.
     * @param {string} [options.lang='en'] - The language for the response.
     * @param {object} options.payload - The authentication profile payload.
     * @param {string} options.accessToken - The access token.
     * @returns {Promise<object>} The upstream response for auth profile creation.
     */
    createAuthProfile(
      token,
      { tenantName, groupId, tenantId, lang, payload, accessToken },
    ) {
      return upstreamRequest({
        method: "POST",
        url: `/intlSamProfile/create/${encodeURIComponent(tenantName)}/${encodeURIComponent(tenantName)}/${groupId}`,
        token,
        params: {
          tenantId,
          lang: lang || "en",
          access_token: accessToken,
        },
        data: payload,
      });
    },

    /**
     * Creates a user group in the upstream API, which typically represents a package.
     * This is usually the second step after creating an auth profile.
     * @param {string} token - The bearer token for authentication.
     * @param {object} options - Options for creating the user group.
     * @param {string} options.groupId - The group ID.
     * @param {string} [options.lang='en'] - The language for the response.
     * @param {object} options.item - The user group item payload (e.g., name, authProfileId).
     * @param {string} options.accessToken - The access token.
     * @returns {Promise<object>} The upstream response for user group creation.
     */
    createUserGroup(token, { groupId, lang, item, accessToken }) {
      return upstreamRequest({
        method: "POST",
        url: `/intl/usergroup/group/${groupId}`,
        token,
        params: {
          lang: lang || "en",
          access_token: accessToken,
        },
        data: {
          list: [item],
        },
      });
    },

    /**
     * Updates an authentication profile in the upstream API.
     * @param {string} token - The bearer token for authentication.
     * @param {object} options - Options for updating the auth profile.
     * @param {string} options.tenantName - The tenant name.
     * @param {string} options.groupId - The group ID.
     * @param {string} options.tenantId - The tenant ID.
     * @param {string} [options.lang='en'] - The language for the response.
     * @param {object} options.payload - The updated authentication profile payload.
     * @param {string} options.accessToken - The access token.
     * @returns {Promise<object>} The upstream response for auth profile update.
     */
    updateAuthProfile(
      token,
      { tenantName, groupId, tenantId, lang, payload, accessToken },
    ) {
      return upstreamRequest({
        method: "POST", // Note: This might be PUT depending on the upstream API spec.
        url: `/intlSamProfile/update/${encodeURIComponent(tenantName)}/${encodeURIComponent(tenantName)}/${groupId}`,
        token,
        params: {
          tenantId,
          group_id: groupId,
          lang: lang || "en",
          access_token: accessToken,
        },
        data: payload,
      });
    },

    /**
     * Updates a user group (package) in the upstream API.
     * @param {string} token - The bearer token for authentication.
     * @param {object} options - Options for updating the user group.
     * @param {string} options.groupId - The group ID.
     * @param {string} [options.lang='en'] - The language for the response.
     * @param {object} options.payload - The updated user group payload.
     * @param {string} options.accessToken - The access token.
     * @returns {Promise<object>} The upstream response for user group update.
     */
    updateUserGroup(token, { groupId, lang, payload, accessToken }) {
      return upstreamRequest({
        method: "PUT",
        url: `/intl/usergroup/group/${groupId}`,
        token,
        params: {
          group_id: groupId,
          lang: lang || "en",
          access_token: accessToken,
        },
        data: payload,
      });
    },

    /**
     * Updates a package group in the upstream API.
     * NOTE: This method is likely deprecated or part of a two-step process (updateAuthProfile, updateUserGroup).
     * @param {string} token - The bearer token for authentication.
     * @param {string} groupId - The ID of the group to update.
     * @param {object} payload - The package group update payload.
     * @returns {Promise<object>} The upstream response for package group update.
     */
    updatePackageGroup(token, groupId, payload) {
      return upstreamRequest({
        method: "POST", // Note: This might be PUT depending on the upstream API spec.
        url: `/packages/${groupId}`,
        token,
        data: payload,
      });
    },

    /**
     * Deletes a package from the upstream API.
     * NOTE: This method is likely deprecated or part of a two-step process (deleteUserGroup, deleteAuthProfile).
     * @param {string} token - The bearer token for authentication.
     * @param {string} uuid - The UUID of the package to delete.
     * @returns {Promise<object>} The upstream response for package deletion.
     */
    deletePackage(token, uuid) {
      return upstreamRequest({
        method: "DELETE",
        url: `/packages/${uuid}`,
        token,
      });
    },

    /**
     * Deletes a user group (package) from the upstream API.
     * @param {string} token - The bearer token for authentication.
     * @param {object} options - Options for deleting the user group.
     * @param {string} options.groupId - The group ID the package belongs to.
     * @param {number} options.packageId - The ID of the package (user group) to delete.
     * @param {string} [options.lang='en'] - The language for the response.
     * @param {string} options.accessToken - The access token.
     * @returns {Promise<object>} The upstream response for user group deletion.
     */
    deleteUserGroup(token, { groupId, packageId, lang, accessToken }) {
      return upstreamRequest({
        method: "DELETE",
        url: `/intl/usergroup/group/${groupId}`,
        token,
        params: {
          lang: lang || "en",
          access_token: accessToken,
        },
        data: {
          list: [packageId],
        },
      });
    },

    /**
     * Deletes an authentication profile from the upstream API.
     * @param {string} token - The bearer token for authentication.
     * @param {object} options - Options for deleting the auth profile.
     * @param {string} options.authProfileId - The ID of the authentication profile to delete.
     * @param {string} options.tenantId - The tenant ID.
     * @param {string} options.groupId - The group ID the profile belongs to.
     * @param {string} [options.lang='en'] - The language for the response.
     * @param {string} options.accessToken - The access token.
     * @returns {Promise<object>} The upstream response for auth profile deletion.
     */
    deleteAuthProfile(
      token,
      { authProfileId, tenantId, groupId, lang, accessToken },
    ) {
      return upstreamRequest({
        method: "DELETE",
        url: `/intlSamProfile/delete/${encodeURIComponent(authProfileId)}`,
        token,
        params: {
          tenantId,
          group_id: groupId,
          lang: lang || "en",
          access_token: accessToken,
        },
      });
    },
  };
}

module.exports = {
  createPackageGateway,
};
