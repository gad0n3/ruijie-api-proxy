const { resolveAuthenticatedSession } = require("../../../helpers/tokenParser");

// VOUCHER STATUS CONSTANTS
const VOUCHER_STATUS = {
  UNUSED: 1, // remain
  INUSE: 2, // active
  EXPIRED: 3, // expired
};

function validateGroupIdQuery(query, label) {
  if (!query?.groupId) {
    const error = new Error(`groupId is required in query for ${label}.`);
    error.statusCode = 400;
    throw error;
  }
}

function validateVoucherStatusQuery(query) {
  if (!query?.groupId) {
    const error = new Error("groupId is required in query for voucher status.");
    error.statusCode = 400;
    throw error;
  }
}

function validateVoucherListSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || "Get voucher list failed.");
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(
      response?.voucherData?.msg || "Voucher data fetch failed.",
    );
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function validateVoucherStatusSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || "Get voucher status failed.");
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(
      response?.voucherData?.msg || "Voucher status fetch failed.",
    );
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function formatSpeed(rateLimit) {
  const value = Number(rateLimit) || 0;

  if (value <= 0) {
    return "0Mbps";
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
    return "Unlimited";
  }

  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days > 1 ? "s" : ""}`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  return `${minutes} min`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDateOnly(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function groupVouchersByDate(vouchers, status) {
  const groups = {};

  vouchers.forEach((voucher) => {
    let timestamp;
    let timeType;

    // Determine which timestamp to use based on status
    if (status === VOUCHER_STATUS.EXPIRED && voucher.expiryTime) {
      timestamp = voucher.expiryTime;
      timeType = "expiryDate";
    } else if (status === VOUCHER_STATUS.INUSE && voucher.loginTime) {
      timestamp = voucher.loginTime;
      timeType = "loginDate";
    } else {
      timestamp = voucher.createTime;
      timeType = "createDate";
    }

    const dateKey = formatDateOnly(timestamp);

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        timeType,
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

function mapVoucher(item) {
  const packagePrice = Number(item?.packagePrice) || 0;

  return {
    voucherCode: item?.voucherCode || "",
    timePeriod: Number(item?.timePeriod) || 0,
    maxClients: Number(item?.maxClients) || 0,
    status: String(item?.status || ""),
    packagePrice,
    bindMac: Number(item?.bindMac) || 0,
    packageName: item?.packageName || "",
    userGroupId: String(item?.userGroupId || ""),
    disableStatus: Number(item?.disableStatus) || 0,
    price: `${packagePrice}ကျပ်`,
    dl_speed: formatSpeed(item?.downloadRateLimit),
    ul_speed: formatSpeed(item?.uploadRateLimit),
    duration: formatDuration(item?.timePeriod),
    createTime: item?.createTime || null,
    humanCreateTime: formatTimestamp(item?.createTime),
    expiryTime: item?.expiryTime || null,
    humanExpiryTime: formatTimestamp(item?.expiryTime),
    loginTime: item?.loginTime || null,
    humanLoginTime: formatTimestamp(item?.loginTime),
  };
}

function mapVoucherWithTimestamps(item) {
  const base = mapVoucher(item);
  return {
    ...base,
    uuid: item?.uuid || "",
    expiryTime: item?.expiryTime || null,
    humanExpiryTime: formatTimestamp(item?.expiryTime),
    loginTime: item?.loginTime || null,
    humanLoginTime: formatTimestamp(item?.loginTime),
    createTime: item?.createTime || null,
    humanCreateTime: formatTimestamp(item?.createTime),
  };
}

function mapGeneratedVoucher(item) {
  return {
    uuid: item?.uuid || "",
    voucherCode: item?.codeNo || "",
    status: String(item?.status || ""),
    profileId: item?.profileId || "",
    expiryTime: item?.expiryTime || "",
  };
}

function mapVoucherStatus(voucherData) {
  return {
    expired: Number(voucherData?.expired) || 0,
    total: Number(voucherData?.total) || 0,
    used: Number(voucherData?.used) || 0,
  };
}

function validateDeleteExpiredInput(query) {
  if (!query?.groupId) {
    const error = new Error(
      "groupId is required in query for deleting vouchers.",
    );
    error.statusCode = 400;
    throw error;
  }
}

function validateGenerateVoucherInput(payload) {
  if (!payload || typeof payload !== "object") {
    const error = new Error("Voucher payload is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!payload.groupId) {
    const error = new Error("groupId is required in voucher payload.");
    error.statusCode = 400;
    throw error;
  }

  if (!payload.userGroupId) {
    const error = new Error("userGroupId is required in voucher payload.");
    error.statusCode = 400;
    throw error;
  }

  if (!payload.profile && !payload.authProfileId) {
    const error = new Error(
      "profile (or authProfileId) is required in voucher payload.",
    );
    error.statusCode = 400;
    throw error;
  }
}

function validateGenerateVoucherSuccess(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || "Create voucher failed.");
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(
      response?.voucherData?.msg || "Create voucher voucherData failed.",
    );
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function validateDeleteBatchResponse(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || "Delete voucher batch failed.");
    error.statusCode = 502;
    error.details = response;
    throw error;
  }

  if (Number(response?.voucherData?.code) !== 0) {
    const error = new Error(
      response?.voucherData?.msg || "Delete voucher batch voucherData failed.",
    );
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

// Shared private helper — fetches vouchers from upstream with a fixed status
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
    const error = new Error(
      "tenantName is missing in session. Please login again.",
    );
    error.statusCode = 401;
    throw error;
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

  return list.map(mapVoucher);
}

function createVoucherUseCases({ voucherGateway, voucherSessionRepository }) {
  const deps = { voucherGateway, voucherSessionRepository };

  return {
    // GET /vouchers/active — inuse (status=2)
    async listActiveVouchers(token, query) {
      validateGroupIdQuery(query, "active vouchers");
      const vouchers = await fetchVouchersByStatus(
        deps,
        token,
        query,
        VOUCHER_STATUS.INUSE,
      );
      return groupVouchersByDate(vouchers, VOUCHER_STATUS.INUSE);
    },

    // GET /vouchers/remain — unused (status=1)
    async listRemainVouchers(token, query) {
      validateGroupIdQuery(query, "remaining vouchers");
      const vouchers = await fetchVouchersByStatus(
        deps,
        token,
        query,
        VOUCHER_STATUS.UNUSED,
      );
      return groupVouchersByDate(vouchers, VOUCHER_STATUS.UNUSED);
    },

    // GET /vouchers/expired — expired (status=3)
    async listExpiredVouchers(token, query) {
      validateGroupIdQuery(query, "expired vouchers");
      const vouchers = await fetchVouchersByStatus(
        deps,
        token,
        query,
        VOUCHER_STATUS.EXPIRED,
      );
      return groupVouchersByDate(vouchers, VOUCHER_STATUS.EXPIRED);
    },

    async getVoucherStatus(token, query) {
      validateVoucherStatusQuery(query);

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        voucherSessionRepository,
      );

      if (!session.tenantName || !session.tenantId) {
        const error = new Error(
          "tenantName and tenantId are missing in session. Please login again.",
        );
        error.statusCode = 401;
        throw error;
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

    async getVoucherPerformance(token, query) {
      validateGroupIdQuery(query, "voucher performance");

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        voucherSessionRepository,
      );

      if (!session.tenantName) {
        const error = new Error(
          "tenantName is missing in session. Please login again.",
        );
        error.statusCode = 401;
        throw error;
      }

      // Fetch all vouchers to calculate performance
      const upstreamResponse = await voucherGateway.listVouchers(token, {
        tenantName: session.tenantName,
        groupId: query.groupId,
        start: 0,
        pageSize: 1000,
        status: VOUCHER_STATUS.INUSE, // Get used vouchers for performance
        lang: query.lang || "en",
        accessToken,
      });

      validateVoucherListSuccess(upstreamResponse);

      const vouchers = Array.isArray(upstreamResponse?.voucherData?.list)
        ? upstreamResponse.voucherData.list
        : [];

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

      const lastDay = { count: 0, price: 0 };
      const monthly = { count: 0, price: 0 };

      vouchers.forEach((voucher) => {
        const loginTime = voucher.loginTime || 0;
        const price = Number(voucher.packagePrice) || 0;

        if (loginTime >= oneDayAgo) {
          lastDay.count += 1;
          lastDay.price += price;
        }

        if (loginTime >= oneMonthAgo) {
          monthly.count += 1;
          monthly.price += price;
        }
      });

      return { lastDay, monthly };
    },

    async printUnusedVouchers(token, payload) {
      const { groupId, voucherCount, voucherList = [] } = payload || {};

      if (!groupId) {
        const error = new Error("groupId is required for printing vouchers.");
        error.statusCode = 400;
        throw error;
      }

      if (!voucherCount || voucherCount <= 0) {
        const error = new Error("voucherCount must be a positive number.");
        error.statusCode = 400;
        throw error;
      }

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        voucherSessionRepository,
      );

      if (!session.tenantName) {
        const error = new Error(
          "tenantName is missing in session. Please login again.",
        );
        error.statusCode = 401;
        throw error;
      }

      // Fetch unused vouchers (status=1)
      const upstreamResponse = await voucherGateway.listVouchers(token, {
        tenantName: session.tenantName,
        groupId,
        start: 0,
        pageSize: 1000,
        status: VOUCHER_STATUS.UNUSED,
        lang: "en",
        accessToken,
      });

      validateVoucherListSuccess(upstreamResponse);

      const allUnused = Array.isArray(upstreamResponse?.voucherData?.list)
        ? upstreamResponse.voucherData.list
        : [];

      // Filter out already printed vouchers
      const printedUuids = new Set(
        (voucherList || []).map((v) => String(v.uuid || "")),
      );

      const unprintedVouchers = allUnused
        .filter((v) => !printedUuids.has(String(v.uuid || "")))
        .slice(0, voucherCount)
        .map(mapVoucher);

      return groupVouchersByDate(unprintedVouchers, VOUCHER_STATUS.UNUSED);
    },

    async generateVoucher(token, payload) {
      validateGenerateVoucherInput(payload);

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        voucherSessionRepository,
      );

      if (!session.tenantName) {
        const error = new Error(
          "tenantName is missing in session. Please login again.",
        );
        error.statusCode = 401;
        throw error;
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

    async deleteExpiredVouchers(token, query) {
      validateDeleteExpiredInput(query);

      const { session, accessToken } = await resolveAuthenticatedSession(
        token,
        voucherSessionRepository,
      );

      if (!session.tenantName) {
        const error = new Error(
          "tenantName is missing in session. Please login again.",
        );
        error.statusCode = 401;
        throw error;
      }

      // Fetch expired vouchers (status=3)
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

      // Extract uuid and voucherCode for deletion
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
