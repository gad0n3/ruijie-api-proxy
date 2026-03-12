const request = require("supertest");
const app = require("../app");

describe("demo routes", () => {
  let groupId;
  let packageId;
  let authProfileId;
  let createdVoucher;

  test("health", async () => {
    const response = await request(app).get("/demo/health");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ status: "ok", mode: "demo" });
  });

  test("auth endpoints", async () => {
    const login = await request(app).post("/demo/login");
    expect(login.status).toBe(200);
    expect(login.body.success).toBe(true);
    expect(login.body.data.authorization).toContain("Bearer ");

    const loginCore = await request(app).post("/demo/auth/core/login");
    expect(loginCore.status).toBe(200);
    expect(loginCore.body.success).toBe(true);
    expect(loginCore.body.data.authorization).toContain("Bearer ");

    const projects = await request(app).get("/demo/auth/core/projects");
    expect(projects.status).toBe(200);
    expect(projects.body.success).toBe(true);
    expect(Array.isArray(projects.body.data)).toBe(true);

    const tenant = await request(app).get("/demo/auth/core/tenant");
    expect(tenant.status).toBe(200);
    expect(tenant.body.success).toBe(true);
    expect(tenant.body.data.tenantId).toBeDefined();
  });

  test("network groups", async () => {
    const response = await request(app).get("/demo/network_group");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);

    groupId = response.body.data[0].groupId;
    expect(groupId).toBeDefined();
  });

  test("packages create/list/update", async () => {
    const created = await request(app).post("/demo/packages/create").send({
      groupId,
      name: "Demo 2h",
      userGroupName: "Demo 2h",
    });

    expect(created.status).toBe(200);
    expect(created.body.success).toBe(true);
    expect(created.body.data.id).toBeDefined();
    packageId = created.body.data.id;

    const list = await request(app).get(
      `/demo/packages?groupId=${groupId}&pageIndex=0&pageSize=20&lang=en`,
    );
    expect(list.status).toBe(200);
    expect(list.body.success).toBe(true);
    expect(Array.isArray(list.body.data)).toBe(true);

    const row = list.body.data.find(
      (item) => Number(item.id) === Number(packageId),
    );
    expect(row).toBeDefined();
    authProfileId = row.authProfileId;

    const update = await request(app).post(`/demo/packages/${groupId}`).send({
      id: packageId,
      name: "Demo 2h Updated",
      userGroupName: "Demo 2h Updated",
      authProfileId,
    });

    expect(update.status).toBe(200);
    expect(update.body.success).toBe(true);
    expect(update.body.message).toBe("OK.");
  });

  test("vouchers generate/list/delete", async () => {
    const generate = await request(app).post("/demo/vouchers/generate").send({
      groupId,
      userGroupId: packageId,
      profile: authProfileId,
      count: 2,
      lang: "en",
    });

    expect(generate.status).toBe(200);
    expect(generate.body.success).toBe(true);
    expect(generate.body.data.count).toBe(2);
    createdVoucher = generate.body.data.list[0];
    expect(createdVoucher).toBeDefined();

    const remain = await request(app).get(
      `/demo/vouchers/remain?groupId=${groupId}&start=0&pageSize=100&lang=en`,
    );
    expect(remain.status).toBe(200);
    expect(remain.body.success).toBe(true);
    expect(Array.isArray(remain.body.data)).toBe(true);

    const active = await request(app).get(
      `/demo/vouchers/active?groupId=${groupId}&start=0&pageSize=100&lang=en`,
    );
    expect(active.status).toBe(200);
    expect(active.body.success).toBe(true);
    expect(Array.isArray(active.body.data)).toBe(true);

    const expired = await request(app).get(
      `/demo/vouchers/expired?groupId=${groupId}&start=0&pageSize=100&lang=en`,
    );
    expect(expired.status).toBe(200);
    expect(expired.body.success).toBe(true);
    expect(Array.isArray(expired.body.data)).toBe(true);

    const deleted = await request(app).delete(
      `/demo/vouchers/expired?groupId=${groupId}&lang=en`,
    );

    expect(deleted.status).toBe(200);
    expect(deleted.body.success).toBe(true);
    expect(deleted.body.data.msg).toBe("Success.");
    expect(deleted.body.data.deletedCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(deleted.body.data.expiredVouchers)).toBe(true);
  });

  test("clients endpoints", async () => {
    const clients = await request(app)
      .get("/demo/clients")
      .query({ group_id: groupId, page_index: 1, page_size: 10 });

    expect(clients.status).toBe(200);
    expect(clients.body.success).toBe(true);
    expect(Array.isArray(clients.body.data)).toBe(true);
  });

  test("delete package", async () => {
    const response = await request(app).delete(
      `/demo/packages/${authProfileId}?groupId=${groupId}&packageId=${packageId}&authProfileId=${authProfileId}&lang=en`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("OK.");

    const list = await request(app).get(
      `/demo/packages?groupId=${groupId}&pageIndex=0&pageSize=20&lang=en`,
    );
    expect(list.body.success).toBe(true);
    const found = list.body.data.find(
      (item) => Number(item.id) === Number(packageId),
    );
    expect(found).toBeUndefined();
  });
});
