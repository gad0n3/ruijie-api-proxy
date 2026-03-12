const express = require("express");

function createIdGenerator(start) {
  let current = start;
  return function nextId() {
    current += 1;
    return current;
  };
}

function nowIso() {
  return new Date().toISOString();
}

function makeVoucherCode(index) {
  const base = String(100000000 + index);
  return `demo${base.slice(-6)}`;
}

function createDemoRoutes() {
  const router = express.Router();

  const nextPackageId = createIdGenerator(500003);
  const nextVoucherId = createIdGenerator(900005);

  const demoState = {
    appid: "demo-appid",
    secret: "demo-secret",
    accessToken: "demo-access-token",
    tenantName: "DemoTenant",
    tenantId: 12345,
    groups: [
      { name: "Demo Group A", groupId: 8601001 },
      { name: "Demo Group B", groupId: 8601002 },
      { name: "Demo Group C", groupId: 8601003 },
      { name: "Demo Group D", groupId: 8601004 },
    ],
    packages: [
      {
        id: 500001,
        userGroupName: "Demo 2h",
        authProfileId: "demo-auth-1001",
        name: "Demo 2h",
        groupId: 8601001,
        noOfDevice: 1,
        timePeriod: 0,
        quota: 0,
        uploadRateLimit: 10240,
        downloadRateLimit: 10240,
        durationCtrlType: 0,
        timePeriodTotal: 0,
        limitedTimes: 0,
        price: "1000",
        bindMac: 1,
        kickOffType: 1,
      },
      {
        id: 500002,
        userGroupName: "Demo 4h",
        authProfileId: "demo-auth-1002",
        name: "Demo 4h",
        groupId: 8601001,
        noOfDevice: 2,
        timePeriod: 240,
        quota: 0,
        uploadRateLimit: 15360,
        downloadRateLimit: 15360,
        durationCtrlType: 1,
        timePeriodTotal: 240,
        limitedTimes: 0,
        price: "1500",
        bindMac: 1,
        kickOffType: 1,
      },
      {
        id: 500003,
        userGroupName: "Demo Day Pass",
        authProfileId: "demo-auth-1003",
        name: "Demo Day Pass",
        groupId: 8601002,
        noOfDevice: 1,
        timePeriod: 1440,
        quota: 0,
        uploadRateLimit: 20480,
        downloadRateLimit: 20480,
        durationCtrlType: 1,
        timePeriodTotal: 1440,
        limitedTimes: 1,
        price: "2500",
        bindMac: 0,
        kickOffType: 0,
      },
    ],
    vouchers: [
      {
        uuid: "900001",
        voucherCode: "demo000001",
        status: "1",
        profileId: "demo-auth-1001",
        expiryTime: nowIso(),
        groupId: "8601001",
        userGroupId: "500001",
        packagePrice: 1000,
        bindMac: 1,
        packageName: "Demo Package",
        disableStatus: 0,
        timePeriod: 0,
        maxClients: 1,
        dl_speed: "10Mbps",
        ul_speed: "10Mbps",
        duration: "Unlimited",
        price: "1000Ks",
      },
      {
        uuid: "900002",
        voucherCode: "demo000002",
        status: "3",
        profileId: "demo-auth-1001",
        expiryTime: nowIso(),
        groupId: "8601001",
        userGroupId: "500001",
        packagePrice: 1000,
        bindMac: 1,
        packageName: "Demo Package",
        disableStatus: 0,
        timePeriod: 0,
        maxClients: 1,
        dl_speed: "10Mbps",
        ul_speed: "10Mbps",
        duration: "Unlimited",
        price: "1000Ks",
      },
      {
        uuid: "900003",
        voucherCode: "demo000003",
        status: "1",
        profileId: "demo-auth-1002",
        expiryTime: nowIso(),
        groupId: "8601001",
        userGroupId: "500002",
        packagePrice: 1500,
        bindMac: 1,
        packageName: "Demo 4h",
        disableStatus: 0,
        timePeriod: 240,
        maxClients: 2,
        dl_speed: "15Mbps",
        ul_speed: "15Mbps",
        duration: "4 hours",
        price: "1500Ks",
      },
      {
        uuid: "900004",
        voucherCode: "demo000004",
        status: "2",
        profileId: "demo-auth-1003",
        expiryTime: nowIso(),
        groupId: "8601002",
        userGroupId: "500003",
        packagePrice: 2500,
        bindMac: 0,
        packageName: "Demo Day Pass",
        disableStatus: 0,
        timePeriod: 1440,
        maxClients: 1,
        dl_speed: "20Mbps",
        ul_speed: "20Mbps",
        duration: "1 day",
        price: "2500Ks",
      },
      {
        uuid: "900005",
        voucherCode: "demo000005",
        status: "3",
        profileId: "demo-auth-1003",
        expiryTime: nowIso(),
        groupId: "8601002",
        userGroupId: "500003",
        packagePrice: 2500,
        bindMac: 0,
        packageName: "Demo Day Pass",
        disableStatus: 1,
        timePeriod: 1440,
        maxClients: 1,
        dl_speed: "20Mbps",
        ul_speed: "20Mbps",
        duration: "1 day",
        price: "2500Ks",
      },
    ],
    clients: {
      auth: [
        {
          mac: "ff10.1510.511a",
          ip: "192.168.4.241",
          flowUp: 2377098846,
          flowDown: 2357385442,
          activeSec: 8061,
          duration: "134m",
          staModel: "OPPO Demo",
          authMac: true,
          account: "demo-account",
        },
        {
          mac: "ff10.1510.51ab",
          ip: "192.168.4.142",
          flowUp: 1837098846,
          flowDown: 1857385442,
          activeSec: 4021,
          duration: "67m",
          staModel: "iPhone Demo 14",
          authMac: true,
          account: "demo-iphone",
        },
        {
          mac: "ff10.1510.51ac",
          ip: "192.168.4.143",
          flowUp: 567098846,
          flowDown: 757385442,
          activeSec: 2101,
          duration: "35m",
          staModel: "Pixel Demo 8",
          authMac: true,
          account: "demo-pixel",
        },
      ],
      unauth: [
        {
          mac: "ff10.1410.5111",
          ip: "192.168.4.191",
          account: null,
          authMac: false,
          duration: "134m",
          flowUp: 2400087083,
          flowDown: 2368913962,
          activeSec: 8094,
          staModel: "Demo S23",
        },
        {
          mac: "ff10.1410.5112",
          ip: "192.168.4.192",
          account: null,
          authMac: false,
          duration: "49m",
          flowUp: 530087083,
          flowDown: 768913962,
          activeSec: 2940,
          staModel: "Vivo Demo V30",
        },
        {
          mac: "ff10.1410.5113",
          ip: "192.168.4.193",
          account: null,
          authMac: false,
          duration: "12m",
          flowUp: 120087083,
          flowDown: 168913962,
          activeSec: 760,
          staModel: "Xiaomi Demo 12",
        },
      ],
      suspected: [
        {
          mac: "ff10.1610.511d",
          ip: "192.168.4.215",
          flowUp: 2362331434,
          flowDown: 2411131622,
          flowUpDown: 4773463056,
          activeSec: 8018,
          duration: "133m",
          staModel: "Redmi Note12 Turbo",
          authMac: false,
          account: null,
        },
        {
          mac: "ff10.1610.511e",
          ip: "192.168.4.216",
          flowUp: 1982331434,
          flowDown: 2011131622,
          flowUpDown: 3993463056,
          activeSec: 6800,
          duration: "113m",
          staModel: "Realme Demo GT",
          authMac: false,
          account: null,
        },
        {
          mac: "ff10.1610.511f",
          ip: "192.168.4.217",
          flowUp: 122331434,
          flowDown: 171131622,
          flowUpDown: 293463056,
          activeSec: 1840,
          duration: "30m",
          staModel: "Huawei Demo Nova",
          authMac: false,
          account: null,
        },
      ],
    },
  };

  router.get("/health", (req, res) => {
    res.json({ status: "ok", mode: "demo" });
  });

  function buildLoginResponse() {
    return {
      appid: demoState.appid,
      secret: demoState.secret,
      authorization: `Bearer ${demoState.appid}::${demoState.accessToken}`,
      access_code: null,
    };
  }

  router.post("/login", (req, res) => {
    res.json(buildLoginResponse());
  });

  router.post("/auth/core/login", (req, res) => {
    res.json(buildLoginResponse());
  });

  router.get("/auth/core/projects", (req, res) => {
    res.json({
      code: 0,
      msg: "OK.",
      data: [
        { id: 1, name: "Demo Project" },
        { id: 2, name: "Demo Project B" },
      ],
    });
  });

  router.get("/auth/core/tenant", (req, res) => {
    res.json({
      code: 0,
      msg: "OK.",
      tenantId: demoState.tenantId,
      tenantName: demoState.tenantName,
    });
  });

  router.get("/network_group", (req, res) => {
    res.json(demoState.groups);
  });

  router.get("/packages", (req, res) => {
    const groupId = Number(req.query.groupId);
    const data = Number.isNaN(groupId)
      ? []
      : demoState.packages.filter((item) => Number(item.groupId) === groupId);

    res.json({
      code: 0,
      msg: "OK.",
      data,
      count: data.length,
    });
  });

  router.post("/packages/create", (req, res) => {
    const payload = req.body || {};
    const groupId = Number(payload.groupId);
    const id = nextPackageId();
    const authProfileId = `demo-auth-${id}`;

    const row = {
      id,
      userGroupName:
        payload.userGroupName || payload.name || `Demo Package ${id}`,
      authProfileId,
      name: payload.name || `Demo Package ${id}`,
      groupId: Number.isNaN(groupId) ? demoState.groups[0].groupId : groupId,
      noOfDevice: payload.noOfDevice || 1,
      timePeriod: payload.timePeriod || 0,
      quota: payload.quota || 0,
      uploadRateLimit: payload.uploadRateLimit || 10240,
      downloadRateLimit: payload.downloadRateLimit || 10240,
      durationCtrlType: payload.durationCtrlType || 0,
      timePeriodTotal: payload.timePeriodTotal || 0,
      limitedTimes: payload.limitedTimes || 0,
      price: payload.price || "1000",
      bindMac: payload.bindMac || 1,
      kickOffType: payload.kickOffType || 1,
    };

    demoState.packages.push(row);

    res.json({
      id: row.id,
      noOfDevice: row.noOfDevice,
      timePeriod: row.timePeriod,
      quota: row.quota,
      uploadRateLimit: row.uploadRateLimit,
      downloadRateLimit: row.downloadRateLimit,
      durationCtrlType: row.durationCtrlType,
      timePeriodTotal: row.timePeriodTotal,
      limitedTimes: row.limitedTimes,
      price: row.price,
      bindMac: row.bindMac,
      kickOffType: row.kickOffType,
      groupId: row.groupId,
      name: row.name,
    });
  });

  router.post("/packages/:groupId", (req, res) => {
    const payload = req.body || {};
    const id = Number(payload.id);
    const groupId = Number(req.params.groupId);

    const row = demoState.packages.find((item) => Number(item.id) === id);

    if (row) {
      Object.assign(row, payload, {
        groupId: Number.isNaN(groupId) ? row.groupId : groupId,
      });
    }

    res.json({ code: 0, msg: "OK." });
  });

  router.delete("/packages/:uuid", (req, res) => {
    const packageId = Number(req.query.packageId);
    const authProfileId = req.query.authProfileId || req.params.uuid;

    demoState.packages = demoState.packages.filter((item) => {
      if (!Number.isNaN(packageId) && Number(item.id) === packageId) {
        return false;
      }
      if (
        authProfileId &&
        String(item.authProfileId) === String(authProfileId)
      ) {
        return false;
      }
      return true;
    });

    demoState.vouchers = demoState.vouchers.filter(
      (item) => String(item.profileId) !== String(authProfileId),
    );

    res.json({ code: 0, msg: "OK." });
  });

  router.get("/vouchers/active", (req, res) => {
    const groupId = String(req.query.groupId || "");
    const list = demoState.vouchers.filter(
      (item) =>
        (!groupId || String(item.groupId) === groupId) &&
        String(item.status) === "2",
    );
    res.json(list);
  });

  router.get("/vouchers/remain", (req, res) => {
    const groupId = String(req.query.groupId || "");
    const list = demoState.vouchers.filter(
      (item) =>
        (!groupId || String(item.groupId) === groupId) &&
        String(item.status) === "1",
    );
    res.json(list);
  });

  router.get("/vouchers/expired", (req, res) => {
    const groupId = String(req.query.groupId || "");
    const list = demoState.vouchers.filter(
      (item) =>
        (!groupId || String(item.groupId) === groupId) &&
        String(item.status) === "3",
    );
    res.json(list);
  });

  router.get("/vouchers/status", (req, res) => {
    const groupId = String(req.query.groupId || "");

    if (!groupId) {
      res.status(400).json({
        message: "groupId is required in query for voucher status.",
      });
      return;
    }

    const list = demoState.vouchers.filter(
      (item) => String(item.groupId) === groupId,
    );
    const total = list.length;
    const used = list.filter((item) => String(item.status) === "2").length;
    const expired = list.filter((item) => String(item.status) === "3").length;

    res.json({
      expired,
      total,
      used,
    });
  });

  router.get("/vouchers/performance", (req, res) => {
    const groupId = String(req.query.groupId || "");

    if (!groupId) {
      res.status(400).json({
        message: "groupId is required in query for voucher performance.",
      });
      return;
    }

    // Calculate demo performance metrics
    const list = demoState.vouchers.filter(
      (item) => String(item.groupId) === groupId && String(item.status) === "2",
    );

    const lastDay = { count: Math.min(list.length, 12), price: 12000 };
    const monthly = { count: list.length, price: list.length * 1000 };

    res.json({
      lastDay,
      monthly,
    });
  });

  router.post("/vouchers/generate", (req, res) => {
    const payload = req.body || {};
    const groupId = String(payload.groupId || demoState.groups[0].groupId);
    const userGroupId = String(
      payload.userGroupId || demoState.packages[0]?.id || "500001",
    );
    const profileId = String(
      payload.profile ||
        payload.authProfileId ||
        demoState.packages[0]?.authProfileId ||
        "demo-auth-1001",
    );
    const count = Number(payload.count || payload.quantity || 1);

    const created = [];

    for (let index = 0; index < count; index += 1) {
      const uuid = String(nextVoucherId());
      const voucherCode = makeVoucherCode(Number(uuid));
      const entry = {
        uuid,
        voucherCode,
        status: "1",
        profileId,
        expiryTime: nowIso(),
        groupId,
        userGroupId,
        packagePrice: 1000,
        bindMac: 1,
        packageName: "Demo Package",
        disableStatus: 0,
        timePeriod: 0,
        maxClients: 1,
        dl_speed: "10Mbps",
        ul_speed: "10Mbps",
        duration: "Unlimited",
        price: "1000Ks",
      };

      demoState.vouchers.push(entry);

      created.push({
        uuid: entry.uuid,
        voucherCode: entry.voucherCode,
        status: entry.status,
        profileId: entry.profileId,
        expiryTime: entry.expiryTime,
      });
    }

    res.json({
      count: created.length,
      list: created,
    });
  });

  router.delete("/vouchers/expired", (req, res) => {
    const groupId = String(req.query.groupId || "");

    if (!groupId) {
      res.status(400).json({
        message: "groupId is required in query for deleting vouchers.",
      });
      return;
    }

    // Auto-fetch expired vouchers (status=3)
    const expiredVouchers = demoState.vouchers.filter(
      (item) => String(item.groupId) === groupId && String(item.status) === "3",
    );

    if (expiredVouchers.length === 0) {
      res.json({
        code: 0,
        msg: "Success.",
        deletedCount: 0,
        batchCount: 0,
        expiredVouchers: [],
      });
      return;
    }

    const expiredUuids = new Set(
      expiredVouchers.map((item) => String(item.uuid)),
    );

    const before = demoState.vouchers.length;
    demoState.vouchers = demoState.vouchers.filter(
      (item) => !expiredUuids.has(String(item.uuid)),
    );
    const deletedCount = before - demoState.vouchers.length;

    res.json({
      code: 0,
      msg: "Success.",
      deletedCount,
      batchCount: 1,
      expiredVouchers,
    });
  });

  router.get("/clients", (req, res) => {
    res.json({
      list: demoState.clients.auth,
    });
  });

  router.post("/clients/print", (req, res) => {
    const { groupId, voucherCount, voucherList = [] } = req.body || {};

    if (!groupId) {
      res.status(400).json({
        message: "groupId is required for printing vouchers.",
      });
      return;
    }

    if (!voucherCount || voucherCount <= 0) {
      res.status(400).json({
        message: "voucherCount must be a positive number.",
      });
      return;
    }

    // Get unused vouchers
    const unusedVouchers = demoState.vouchers.filter(
      (item) =>
        String(item.groupId) === String(groupId) && String(item.status) === "1",
    );

    // Filter out already printed vouchers
    const printedUuids = new Set(
      (voucherList || []).map((v) => String(v.uuid || "")),
    );
    const unprintedVouchers = unusedVouchers
      .filter((v) => !printedUuids.has(String(v.uuid || "")))
      .slice(0, voucherCount);

    // Group by date (simplified demo version)
    const grouped = [
      {
        date: nowIso().split("T")[0].replace(/-/g, "/"),
        timeType: "createDate",
        vouchers: unprintedVouchers,
      },
    ];

    res.json(grouped);
  });

  return router;
}

module.exports = createDemoRoutes;
