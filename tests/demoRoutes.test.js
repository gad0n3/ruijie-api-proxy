const request = require('supertest');
const app = require('../app');

describe('demo routes', () => {
  let groupId;
  let packageId;
  let authProfileId;
  let createdVoucher;

  test('health', async () => {
    const response = await request(app).get('/demo/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', mode: 'demo' });
  });

  test('auth endpoints', async () => {
    const login = await request(app).post('/demo/login');
    expect(login.status).toBe(200);
    expect(login.body.authorization).toContain('Bearer ');

    const loginCore = await request(app).post('/demo/auth/core/login');
    expect(loginCore.status).toBe(200);
    expect(loginCore.body.authorization).toContain('Bearer ');

    const projects = await request(app).get('/demo/auth/core/projects');
    expect(projects.status).toBe(200);
    expect(Array.isArray(projects.body.data)).toBe(true);

    const tenant = await request(app).get('/demo/auth/core/tenant');
    expect(tenant.status).toBe(200);
    expect(tenant.body.tenantId).toBeDefined();
  });

  test('network groups', async () => {
    const response = await request(app).get('/demo/network_group');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    groupId = response.body[0].groupId;
    expect(groupId).toBeDefined();
  });

  test('packages create/list/update', async () => {
    const created = await request(app)
      .post('/demo/packages/create')
      .send({
        groupId,
        name: 'Demo 2h',
        userGroupName: 'Demo 2h'
      });

    expect(created.status).toBe(200);
    expect(created.body.id).toBeDefined();
    packageId = created.body.id;

    const list = await request(app).get(`/demo/packages?groupId=${groupId}&pageIndex=0&pageSize=20&lang=en`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);

    const row = list.body.data.find((item) => Number(item.id) === Number(packageId));
    expect(row).toBeDefined();
    authProfileId = row.authProfileId;

    const update = await request(app)
      .post(`/demo/packages/${groupId}`)
      .send({
        id: packageId,
        name: 'Demo 2h Updated',
        userGroupName: 'Demo 2h Updated',
        authProfileId
      });

    expect(update.status).toBe(200);
    expect(update.body.code).toBe(0);
  });

  test('vouchers generate/list/delete', async () => {
    const generate = await request(app)
      .post('/demo/vouchers/generate')
      .send({
        groupId,
        userGroupId: packageId,
        profile: authProfileId,
        count: 2,
        lang: 'en'
      });

    expect(generate.status).toBe(200);
    expect(generate.body.count).toBe(2);
    createdVoucher = generate.body.list[0];
    expect(createdVoucher).toBeDefined();

    const list = await request(app).get(`/demo/vouchers?groupId=${groupId}&status=1&start=0&pageSize=100&lang=en`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const deleteBody = generate.body.list.map((item) => ({
      uuid: item.uuid,
      voucherCode: item.voucherCode
    }));

    const deleted = await request(app)
      .delete(`/demo/vouchers/expired?groupId=${groupId}&lang=en`)
      .send(deleteBody);

    expect(deleted.status).toBe(200);
    expect(deleted.body.code).toBe(0);
  });

  test('clients endpoints', async () => {
    const authClients = await request(app)
      .get('/demo/clients/auth')
      .query({ group_id: groupId, page_index: 1, page_size: 10 });

    expect(authClients.status).toBe(200);
    expect(Array.isArray(authClients.body.list)).toBe(true);

    const unauthClients = await request(app)
      .get('/demo/clients/unauth')
      .query({ group_id: groupId, page_index: 1, page_size: 10 });

    expect(unauthClients.status).toBe(200);
    expect(Array.isArray(unauthClients.body.list)).toBe(true);

    const suspectedClients = await request(app)
      .get('/demo/clients/suspected')
      .query({ group_id: groupId, page_index: 1, page_size: 10 });

    expect(suspectedClients.status).toBe(200);
    expect(Array.isArray(suspectedClients.body.list)).toBe(true);
  });

  test('delete package', async () => {
    const response = await request(app).delete(
      `/demo/packages/${authProfileId}?groupId=${groupId}&packageId=${packageId}&authProfileId=${authProfileId}&lang=en`
    );

    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);

    const list = await request(app).get(`/demo/packages?groupId=${groupId}&pageIndex=0&pageSize=20&lang=en`);
    const found = list.body.data.find((item) => Number(item.id) === Number(packageId));
    expect(found).toBeUndefined();
  });
});
