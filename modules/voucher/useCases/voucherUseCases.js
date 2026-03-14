const { resolveAuthenticatedSession } = require("../../../helpers/tokenParser");
const {
  ValidationError,
  UpstreamError,
  AuthenticationError,
} = require("../../../helpers/AppError");
const {
  validate,
  isRequired,
  isObject,
  isNumber,
  isPositive,
  oneOf,
} = require("../../../helpers/validation");
const {
  formatSpeed,
  formatDuration,
  formatTimestamp,
  formatDateOnly,
  formatShortDateTime,
} = require("../../../helpers/formatter");
const { chunkArray } = require("../../../helpers/utils");

// VOUCHER STATUS CONSTANTS
const VOUCHER_STATUS = {
  UNUSED: 1, // remain
  INUSE: 2, // active
  EXPIRED: 3, // expired
};

/**
 * Validates that groupId is present in the query.
 * @param {object} query - Request query object.
 * @param {string} label - Context label for the error message.
 */
function validateGroupIdQuery(query, label) {
  validate(query, {
    groupId: [isRequired(`groupId is required in query for ${label}.`)],
  });
}

/**
 * Validates that groupId is present for voucher status request.
 * @param {object} query - Request query object.
 */
function validateVoucherStatusQuery(query) {
  validate(query, {
    groupId: [isRequired("groupId is required in query for voucher status.")],
  });
}

/**
 * Validates the upstream response for a voucher list request.
 * @param {object} response - Raw response from upstream.
 */
function validateVoucherListSuccess(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Get voucher list failed.",
      502,
      response,
    );
  }

  if (Number(response?.voucherData?.code) !== 0) {
    throw new UpstreamError(
      response?.voucherData?.msg || "Voucher data fetch failed.",
      502,
      response,
    );
  }
}

/**
 * Validates the upstream response for a voucher status request.
 * @param {object} response - Raw response from upstream.
 */
function validateVoucherStatusSuccess(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Get voucher status failed.",
      502,
      response,
    );
  }

  if (Number(response?.voucherData?.code) !== 0) {
    throw new UpstreamError(
      response?.voucherData?.msg || "Voucher status fetch failed.",
      502,
      response,
    );
  }
}

/**
 * Groups vouchers by date and sorts them in descending order.
 * @param {object[]} vouchers - Array of mapped voucher objects.
 * @param {number} status - The status code used to determine which timestamp to group by.
 * @returns {object[]} Grouped vouchers array.
 */
function groupVouchersByDate(vouchers, status) {
  const groups = {};

  vouchers.forEach((voucher) => {
    let timestamp;
    let time_type;

    if (status === VOUCHER_STATUS.EXPIRED && voucher.expiryTime) {
      timestamp = voucher.expiryTime;
      time_type = "expiry_date";
    } else if (status === VOUCHER_STATUS.INUSE && voucher.loginTime) {
      timestamp = voucher.loginTime;
      time_type = "login_date";
    } else {
      timestamp = voucher.createTime;
      time_type = "create_date";
    }

    const dateKey = formatDateOnly(timestamp);

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        time_type,
        vouchers: [],
      };
    }

    groups[dateKey].vouchers.push(voucher);
  });

  return Object.values(groups).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
}

/**
 * Maps a raw upstream voucher item to the standardized response format.
 * @param {object} item - Raw voucher item from upstream.
 * @returns {object} Formatted voucher object.
 */
function mapVoucher(item) {
  const package_price = Number(item?.packagePrice) || 0;

  return {
    voucher_code: item?.voucherCode || "",
    time_period: Number(item?.timePeriod) || 0,
    max_clients: Number(item?.maxClients) || 0,
    status: String(item?.status || ""),
    package_price,
    price_label: `${package_price}ကျပ်`,
    bind_mac: Number(item?.bindMac) || 0,
    package_name: item?.packageName || "",
    user_group_id: String(item?.userGroupId || ""),
    disable_status: Number(item?.disableStatus) || 0,
    speed: formatSpeed(item?.downloadRateLimit),
    duration: formatDuration(item?.timePeriod),
    create_time: formatShortDateTime(item?.createTime),
    expiry_time: formatShortDateTime(item?.expiryTime),
    login_time: formatShortDateTime(item?.loginTime),
  };
}

/**
 * Maps a raw voucher item including UUID and human-readable timestamps.
 * @param {object} item - Raw voucher item.
 * @returns {object} Extended voucher object.
 */
function mapVoucherWithTimestamps(item) {
  const base = mapVoucher(item);
  return {
    ...base,
    uuid: item?.uuid || "",
  };
}

/**
 * Maps a newly generated voucher item to a simplified format.
 * @param {object} item - Raw generated voucher.
 * @returns {object} Simplified voucher data.
 */
function mapGeneratedVoucher(item) {
  return {
    uuid: item?.uuid || "",
    voucherCode: item?.codeNo || "",
    status: String(item?.status || ""),
    profileId: item?.profileId || "",
    expiryTime: item?.expiryTime || "",
  };
}

/**
 * Maps voucher status summary data.
 * @param {object} voucherData - Upstream voucher data summary.
 * @returns {object} Mapped status summary.
 */
function mapVoucherStatus(voucherData) {
  return {
    expired: Number(voucherData?.expired) || 0,
    total: Number(voucherData?.total) || 0,
    used: Number(voucherData?.used) || 0,
  };
}

/**
 * Validates input for deleting expired vouchers.
 * @param {object} query - Request query object.
 */
function validateDeleteExpiredInput(query) {
  validate(query, {
    groupId: [
      isRequired("groupId is required in query for deleting vouchers."),
    ],
  });
}

/**
 * Validates input for generating new vouchers.
 * @param {object} payload - Request body object.
 */
function validateGenerateVoucherInput(payload) {
  validate(payload, {
    groupId: [isRequired("groupId is required in voucher payload.")],
    userGroupId: [isRequired("userGroupId is required in voucher payload.")],
    count: [
      isRequired("count is required"),
      isNumber("count must be a number"),
      isPositive("count must be a positive number"),
    ],
    _crossFieldValidators: [
      oneOf(
        ["profile", "authProfileId"],
        "profile (or authProfileId) is required in voucher payload.",
      ),
    ],
  });
}

/**
 * Validates the upstream response for voucher generation.
 * @param {object} response - Upstream response.
 */
function validateGenerateVoucherSuccess(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Create voucher failed.",
      502,
      response,
    );
  }

  if (Number(response?.voucherData?.code) !== 0) {
    throw new UpstreamError(
      response?.voucherData?.msg || "Create voucher voucherData failed.",
      502,
      response,
    );
  }
}

/**
 * Validates the upstream response for a batch deletion request.
 * @param {object} response - Upstream response.
 */
function validateDeleteBatchResponse(response) {
  if (Number(response?.code) !== 0) {
    throw new UpstreamError(
      response?.msg || "Delete voucher batch failed.",
      502,
      response,
    );
  }

  if (Number(response?.voucherData?.code) !== 0) {
    throw new UpstreamError(
      response?.voucherData?.msg || "Delete voucher batch voucherData failed.",
      502,
      response,
    );
  }
}

/**
 * Internal helper to fetch vouchers from upstream based on status.
 */
async function fetchVouchersByStatus(
  { voucherGateway, voucherSessionRepository },
  token,
  query,
  status,
) {
  const { session, accessToken } = await resolveAuthenticatedSession(
    token,
    voucherSessionRepository,
  );

  if (!session.tenantName) {
    throw new AuthenticationError(
      "tenantName is missing in session. Please login again.",
    );
  }

  const upstreamResponse = await voucherGateway.listVouchers(token, {
    tenantName: session.tenantName,
    groupId: query.groupId,
    start: typeof query.start === "undefined" ? 0 : query.start,
    pageSize: typeof query.pageSize === "undefined" ? 100 : query.pageSize,
    status,
    lang: query.lang || "en",
    accessToken,
  });

  validateVoucherListSuccess(upstreamResponse);

  const list = Array.isArray(upstreamResponse?.voucherData?.list)
    ? upstreamResponse.voucherData.list
    : [];

  return list;
}

/**
 * Groups raw vouchers by date, then maps each voucher via mapVoucher.
 */
function groupAndMapVouchers(rawVouchers, status) {
  const grouped = groupVouchersByDate(rawVouchers, status);
  return grouped.map((group) => ({
    ...group,
    vouchers: group.vouchers.map(mapVoucher),
  }));
}

/**
 * Factory for creating voucher use cases.
 */
function createVoucherUseCases({ voucherGateway, voucherSessionRepository }) {
  const deps = { voucherGateway, voucherSessionRepository };

  return {
    /**
     * Lists active (in-use) vouchers.
     */
    async listActiveVouchers(token, query) {
      validateGroupIdQuery(query, "active vouchers");
      const rawVouchers = await fetchVouchersByStatus(
        deps,
        token,
        query,
        VOUCHER_STATUS.INUSE,
      );
      return groupAndMapVouchers(rawVouchers, VOUCHER_STATUS.INUSE);
    },

    /**
     * Lists remaining (unused) vouchers.
     */
    async listRemainVouchers(token, query) {
      validateGroupIdQuery(query, "remaining vouchers");
      const rawVouchers = await fetchVouchersByStatus(
        deps,
        token,
        query,
        VOUCHER_STATUS.UNUSED,
      );
      return groupAndMapVouchers(rawVouchers, VOUCHER_STATUS.UNUSED);
    },

    /**
     * Lists expired vouchers.
     */
    async listExpiredVouchers(token, query) {
      validateGroupIdQuery(query, "expired vouchers");
      const rawVouchers = await fetchVouchersByStatus(
        deps,
        token,
        query,
        VOUCHER_STATUS.EXPIRED,
      );
      return groupAndMapVouchers(rawVouchers, VOUCHER_STATUS.EXPIRED);
    },

    /**
     * Retrieves the voucher status summary (total, used, expired).
     */
    async getVoucherStatus(token, query) {
      validateVoucherStatusQuery(query);

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        voucherSessionRepository,
      );

      if (!session.tenantName || !session.tenantId) {
        throw new AuthenticationError(
          "tenantName and tenantId are missing in session. Please login again.",
        );
      }

      const upstreamResponse = await voucherGateway.getVoucherStatus(token, {
        tenantName: session.tenantName,
        groupId: query.groupId,
        tenantId: session.tenantId,
        accessToken,
      });

      validateVoucherStatusSuccess(upstreamResponse);

      return mapVoucherStatus(upstreamResponse?.voucherData);
    },

    /**
     * Retrieves voucher performance metrics (last day, monthly).
     */
    async getVoucherPerformance(token, query) {
      validateGroupIdQuery(query, "voucher performance");

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        voucherSessionRepository,
      );

      if (!session.tenantName) {
        throw new AuthenticationError(
          "tenantName is missing in session. Please login again.",
        );
      }

      const commonParams = {
        tenantName: session.tenantName,
        groupId: query.groupId,
        start: 0,
        pageSize: 1000,
        lang: query.lang || "en",
        accessToken,
      };

      // Fetch in-use vouchers for lastDay calculation
      const inuseResponse = await voucherGateway.listVouchers(token, {
        ...commonParams,
        status: VOUCHER_STATUS.INUSE,
      });
      validateVoucherListSuccess(inuseResponse);
      const inuseVouchers = Array.isArray(inuseResponse?.voucherData?.list)
        ? inuseResponse.voucherData.list
        : [];

      // Fetch expired vouchers for monthly calculation
      const expiredResponse = await voucherGateway.listVouchers(token, {
        ...commonParams,
        status: VOUCHER_STATUS.EXPIRED,
      });
      validateVoucherListSuccess(expiredResponse);
      const expiredVouchers = Array.isArray(expiredResponse?.voucherData?.list)
        ? expiredResponse.voucherData.list
        : [];

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

      // lastDay: in-use vouchers activated within last 24 hours
      const lastDay = { count: 0, price: 0, packages: {} };
      inuseVouchers.forEach((voucher) => {
        const loginTime = voucher.loginTime || 0;
        const price = Number(voucher.packagePrice) || 0;
        const pkgName = voucher.packageName || "Unknown";
        if (loginTime >= oneDayAgo) {
          lastDay.count += 1;
          lastDay.price += price;
          lastDay.packages[pkgName] = (lastDay.packages[pkgName] || 0) + 1;
        }
      });
      // Convert packages map to array
      lastDay.packages = Object.entries(lastDay.packages).map(
        ([name, count]) => ({ name, count }),
      );

      // monthly: expired vouchers that expired within last 30 days
      const monthly = { count: 0, price: 0, packages: {} };
      expiredVouchers.forEach((voucher) => {
        const expiryTime = voucher.expiryTime || 0;
        const price = Number(voucher.packagePrice) || 0;
        const pkgName = voucher.packageName || "Unknown";
        if (expiryTime >= oneMonthAgo) {
          monthly.count += 1;
          monthly.price += price;
          monthly.packages[pkgName] = (monthly.packages[pkgName] || 0) + 1;
        }
      });
      // Convert packages map to array
      monthly.packages = Object.entries(monthly.packages).map(
        ([name, count]) => ({ name, count }),
      );

      return { lastDay, monthly };
    },

    /**
     * Generates new vouchers via the upstream API.
     */
    async generateVoucher(token, payload) {
      validateGenerateVoucherInput(payload);

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        voucherSessionRepository,
      );

      if (!session.tenantName) {
        throw new AuthenticationError(
          "tenantName is missing in session. Please login again.",
        );
      }

      const quantity = String(
        typeof payload.quantity !== "undefined"
          ? payload.quantity
          : typeof payload.count !== "undefined"
            ? payload.count
            : 1,
      );

      const upstreamPayload = {
        createCodeType: String(payload.createCodeType || "1"),
        codeSize: Number(payload.codeSize || 9),
        firstName: payload.firstName || "",
        lastName: payload.lastName || "",
        email: payload.email || "",
        phone: payload.phone || "",
        comment: payload.comment || "",
        quantity,
        userGroupId: Number(payload.userGroupId),
        profile: String(payload.profile || payload.authProfileId),
      };

      const response = await voucherGateway.generateVoucher(token, {
        tenantName: session.tenantName,
        groupId: payload.groupId,
        lang: payload.lang || "en",
        accessToken,
        payload: upstreamPayload,
      });

      validateGenerateVoucherSuccess(response);

      const list = Array.isArray(response?.voucherData?.list)
        ? response.voucherData.list
        : [];

      return {
        count: Number(response?.voucherData?.count) || list.length,
        list: list.map(mapGeneratedVoucher),
      };
    },

    /**
     * Fetches and deletes all expired vouchers for a specific group.
     */
    async deleteExpiredVouchers(token, query) {
      validateDeleteExpiredInput(query);

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        voucherSessionRepository,
      );

      if (!session.tenantName) {
        throw new AuthenticationError(
          "tenantName is missing in session. Please login again.",
        );
      }

      const upstreamResponse = await voucherGateway.listVouchers(token, {
        tenantName: session.tenantName,
        groupId: query.groupId,
        start: 0,
        pageSize: 1000,
        status: VOUCHER_STATUS.EXPIRED,
        lang: query.lang || "en",
        accessToken,
      });

      validateVoucherListSuccess(upstreamResponse);

      const expiredList = Array.isArray(upstreamResponse?.voucherData?.list)
        ? upstreamResponse.voucherData.list
        : [];

      if (expiredList.length === 0) {
        return {
          code: 0,
          msg: "Success.",
          deletedCount: 0,
          batchCount: 0,
          expiredVouchers: [],
        };
      }

      const rows = expiredList.map((item) => ({
        uuid: String(item?.uuid || ""),
        voucherCode: String(item?.voucherCode || ""),
      }));

      const batches = chunkArray(rows, 100);

      for (const batch of batches) {
        const ids = batch.map((item) => item.uuid).join(",");
        const list = batch.map((item) => ({ voucherCode: item.voucherCode }));

        const response = await voucherGateway.deleteVoucherBatch(token, {
          ids,
          groupId: query.groupId,
          lang: query.lang || "en",
          accessToken,
          list,
        });

        validateDeleteBatchResponse(response);
      }

      return {
        code: 0,
        msg: "Success.",
        deletedCount: rows.length,
        batchCount: batches.length,
        expiredVouchers: expiredList.map(mapVoucherWithTimestamps),
      };
    },
  };
}

module.exports = {
  createVoucherUseCases,
};
