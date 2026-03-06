const crypto = require('crypto');
const express = require('express');
const config = require('../config');
const asyncHandler = require('../middleware/asyncHandler');
const { listSessions } = require('../infrastructure/sessionStore');
const { verifyAdminCredential } = require('../infrastructure/adminStore');
const {
  listVipCredentials,
  upsertVipCredential,
  deleteVipCredential
} = require('../infrastructure/vipCredentialStore');

const COOKIE_NAME = 'admin_token';

function maskToken(token) {
  const value = String(token || '');

  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function parseCookies(cookieHeader) {
  const source = String(cookieHeader || '');
  const out = {};

  source.split(';').forEach((entry) => {
    const idx = entry.indexOf('=');
    if (idx <= 0) {
      return;
    }

    const key = entry.slice(0, idx).trim();
    const val = entry.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });

  return out;
}

function signPayload(payload) {
  return crypto
    .createHmac('sha256', config.adminAuth.sessionSecret)
    .update(payload)
    .digest('hex');
}

function createAdminToken(payloadObject) {
  const payload = Buffer.from(JSON.stringify(payloadObject), 'utf8').toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const payload = parts[0];
  const signature = parts[1];
  const expected = signPayload(payload);

  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== actualBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const decoded = JSON.parse(json);

    if (!decoded || !decoded.username || !decoded.exp || Date.now() > decoded.exp) {
      return null;
    }

    return decoded;
  } catch (_error) {
    return null;
  }
}

function setAdminCookie(res, token) {
  const maxAge = config.adminAuth.sessionTtlSeconds;
  const isProd = process.env.NODE_ENV === 'production';
  const cookieParts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`
  ];

  if (isProd) {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function clearAdminCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function getAdminFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  return verifyAdminToken(token);
}

function requireAdminAuth(req, res, next) {
  const admin = getAdminFromRequest(req);

  if (!admin) {
    const error = new Error('Admin authentication required');
    error.statusCode = 401;
    return next(error);
  }

  req.admin = admin;
  return next();
}

function buildLoginHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ruijie Admin Login</title>
  <style>
    :root {
      --bg: #f1f5f9;
      --panel: #ffffff;
      --text: #1e293b;
      --line: #cbd5e1;
      --accent: #0f766e;
      --danger-bg: #fee2e2;
      --danger-text: #991b1b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at 20% 0%, #bae6fd 0%, #f8fafc 55%);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color: var(--text);
      padding: 16px;
    }
    .panel {
      width: 100%;
      max-width: 380px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
    }
    h1 { margin: 0 0 8px 0; font-size: 22px; }
    p { margin: 0 0 14px 0; color: #64748b; font-size: 13px; }
    label { display: block; margin-top: 10px; font-size: 13px; font-weight: 600; }
    input {
      width: 100%;
      margin-top: 6px;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 10px;
      font-size: 14px;
    }
    button {
      margin-top: 14px;
      width: 100%;
      border: none;
      border-radius: 10px;
      background: var(--accent);
      color: #fff;
      font-weight: 700;
      padding: 10px;
      cursor: pointer;
    }
    .error {
      display: none;
      margin-top: 10px;
      border: 1px solid #fecaca;
      background: var(--danger-bg);
      color: var(--danger-text);
      border-radius: 10px;
      padding: 8px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="panel">
    <h1>Admin Login</h1>
    <p>Use Firebase-backed admin credentials.</p>

    <form id="loginForm">
      <label>Username
        <input type="text" id="username" name="username" autocomplete="username" required />
      </label>
      <label>Password
        <input type="password" id="password" name="password" autocomplete="current-password" required />
      </label>
      <button type="submit">Sign in</button>
    </form>

    <div class="error" id="error"></div>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('error');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorEl.style.display = 'none';

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const payload = await response.json();

        if (!payload.success) {
          throw new Error(payload.message || 'Login failed');
        }

        window.location.href = '/admin';
      } catch (error) {
        errorEl.textContent = error.message || 'Login failed';
        errorEl.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
}

function buildDashboardHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ruijie Admin Dashboard</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --panel: #ffffff;
      --text: #1e293b;
      --muted: #64748b;
      --line: #e2e8f0;
      --accent: #0f766e;
      --accent-soft: #ccfbf1;
      --vip: #a21caf;
      --vip-soft: #f5d0fe;
      --danger: #b91c1c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      background: radial-gradient(circle at top right, #dbeafe 0%, var(--bg) 45%);
      color: var(--text);
    }
    .wrap {
      max-width: 1150px;
      margin: 24px auto;
      padding: 0 16px 30px;
      display: grid;
      gap: 14px;
    }
    .head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }
    h1 { margin: 0; font-size: 24px; letter-spacing: 0.2px; }
    h2 { margin: 0; font-size: 18px; }
    .muted { color: var(--muted); font-size: 13px; }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .stat-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
    }
    .stat-label {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--text);
      line-height: 1.1;
    }
    .actions {
      padding: 12px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .right { display: flex; gap: 8px; align-items: center; }
    button {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 10px;
      padding: 8px 12px;
      cursor: pointer;
      font-weight: 600;
      color: var(--text);
    }
    button.primary {
      border-color: var(--accent);
      background: var(--accent);
      color: white;
    }
    button.danger {
      border-color: #fecaca;
      color: var(--danger);
      background: #fff;
    }
    .button-link {
      display: inline-block;
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 10px;
      padding: 8px 12px;
      font-weight: 600;
      color: var(--text);
      text-decoration: none;
      line-height: 1.2;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: middle;
    }
    th {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f8fafc;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
    }
    .badge.vip {
      background: var(--vip-soft);
      color: var(--vip);
    }
    .empty {
      padding: 24px;
      text-align: center;
      color: var(--muted);
    }
    .error {
      margin: 12px;
      padding: 10px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
      border-radius: 10px;
      display: none;
    }
    .notice {
      margin: 12px;
      padding: 10px;
      border-radius: 10px;
      font-size: 13px;
      border: 1px solid transparent;
      display: none;
    }
    .notice.success {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }
    .notice.error {
      background: #fef2f2;
      color: #991b1b;
      border-color: #fecaca;
    }
    .notice.info {
      background: #eff6ff;
      color: #1e3a8a;
      border-color: #bfdbfe;
    }
    .form-grid {
      padding: 12px;
      border-bottom: 1px solid var(--line);
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
      gap: 8px;
      align-items: end;
    }
    .vip-status {
      margin: 0 12px 12px;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid transparent;
      font-size: 13px;
      display: none;
    }
    .vip-status.success {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }
    .vip-status.error {
      background: #fef2f2;
      color: #991b1b;
      border-color: #fecaca;
    }
    label {
      display: block;
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 4px;
    }
    input {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 13px;
    }
    @media (max-width: 980px) {
      .stats { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr 1fr; }
      .form-grid .submit-wrap { grid-column: span 2; }
      th:nth-child(4), td:nth-child(4),
      th:nth-child(6), td:nth-child(6) {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <div>
        <h1>Admin Dashboard</h1>
        <div class="muted">Manage VIP credentials mapped to Ruijie appid/secret</div>
      </div>
      <div class="muted" id="lastUpdated">Last updated: -</div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Total User</div>
        <div class="stat-value" id="totalUserCount">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">VIP User</div>
        <div class="stat-value" id="vipUserCount">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">VIP Mapping Count</div>
        <div class="stat-value" id="vipMappingCount">0</div>
      </div>
    </div>

    <div class="panel">
      <div class="actions">
        <h2>Login Sessions</h2>
        <div class="right">
          <span class="muted" id="count">0 sessions</span>
          <button id="refresh" class="primary">Refresh</button>
          <a id="logoutLink" class="button-link" href="/admin/logout">Logout</a>
        </div>
      </div>
      <div class="error" id="error"></div>
      <div class="notice" id="notice"></div>
      <div id="sessionTableWrap"></div>
    </div>

    <div class="panel">
      <div class="actions">
        <h2>VIP Credentials</h2>
        <div class="muted" id="vipCount">0 records</div>
      </div>

      <form id="vipForm" class="form-grid">
        <div>
          <label for="vipUsername">VIP Username</label>
          <input id="vipUsername" required />
        </div>
        <div>
          <label for="vipPassword">VIP Password</label>
          <input id="vipPassword" type="password" required />
        </div>
        <div>
          <label for="vipAppId">Mapped App ID</label>
          <input id="vipAppId" required />
        </div>
        <div>
          <label for="vipSecret">Mapped Secret</label>
          <input id="vipSecret" required />
        </div>
        <div class="submit-wrap">
          <button class="primary" type="submit">Add / Update VIP</button>
        </div>
      </form>

      <div id="vipStatus" class="vip-status"></div>

      <div id="vipTableWrap"></div>
    </div>
  </div>

  <script>
    const sessionTableWrap = document.getElementById('sessionTableWrap');
    const vipTableWrap = document.getElementById('vipTableWrap');
    const countEl = document.getElementById('count');
    const vipCountEl = document.getElementById('vipCount');
    const errorEl = document.getElementById('error');
    const noticeEl = document.getElementById('notice');
    const lastUpdated = document.getElementById('lastUpdated');
    const vipStatusEl = document.getElementById('vipStatus');
    const totalUserCountEl = document.getElementById('totalUserCount');
    const vipUserCountEl = document.getElementById('vipUserCount');
    const vipMappingCountEl = document.getElementById('vipMappingCount');

    function escapeHtml(input) {
      return String(input ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function safeRequest(path, options) {
      return fetch(path, options).then(async (response) => {
        const payload = await response.json();

        if (!payload.success) {
          throw new Error(payload.message || 'Request failed');
        }

        return payload.data;
      });
    }

    function hideNotice() {
      noticeEl.style.display = 'none';
      noticeEl.className = 'notice';
      noticeEl.textContent = '';
    }

    function showNotice(type, message) {
      noticeEl.className = 'notice ' + type;
      noticeEl.textContent = message;
      noticeEl.style.display = 'block';
    }

    function clearVipStatus() {
      vipStatusEl.className = 'vip-status';
      vipStatusEl.textContent = '';
      vipStatusEl.style.display = 'none';
    }

    function showVipStatus(type, message) {
      vipStatusEl.className = 'vip-status ' + type;
      vipStatusEl.textContent = message;
      vipStatusEl.style.display = 'block';
    }

    function renderSessions(rows) {
      if (!rows.length) {
        sessionTableWrap.innerHTML = '<div class="empty">No login sessions found.</div>';
        return;
      }

      const body = rows.map((row) => {
        const tierClass = row.isVip ? 'vip' : '';
        const tierLabel = row.isVip ? 'VIP' : 'NORMAL';

        return '<tr>' +
          '<td>' + escapeHtml(row.appid) + '</td>' +
          '<td>' + escapeHtml(row.tenantName) + '</td>' +
          '<td>' + escapeHtml(row.tenantId) + '</td>' +
          '<td>' + escapeHtml(row.accessTokenMasked) + '</td>' +
          '<td><span class="badge ' + tierClass + '">' + tierLabel + '</span></td>' +
          '<td>' + escapeHtml(row.updatedAt || row.createdAt || '-') + '</td>' +
          '</tr>';
      }).join('');

      sessionTableWrap.innerHTML = '<table>' +
        '<thead><tr>' +
          '<th>App ID</th><th>Tenant</th><th>Tenant ID</th><th>Access Token</th><th>Tier</th><th>Updated</th>' +
        '</tr></thead>' +
        '<tbody>' + body + '</tbody>' +
      '</table>';
    }

    function renderVipCredentials(rows) {
      if (!rows.length) {
        vipTableWrap.innerHTML = '<div class="empty">No VIP credentials configured.</div>';
        return;
      }

      const body = rows.map((row) => {
        const safeUsername = escapeHtml(row.username);
        return '<tr>' +
          '<td>' + safeUsername + '</td>' +
          '<td>' + escapeHtml(row.appid) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt || row.createdAt || '-') + '</td>' +
          '<td><button class="danger" onclick="removeVipCredential(\'' + safeUsername + '\')">Delete</button></td>' +
          '</tr>';
      }).join('');

      vipTableWrap.innerHTML = '<table>' +
        '<thead><tr>' +
          '<th>VIP Username</th><th>Mapped App ID</th><th>Updated</th><th>Action</th>' +
        '</tr></thead>' +
        '<tbody>' + body + '</tbody>' +
      '</table>';
    }

    async function load() {
      errorEl.style.display = 'none';
      try {
        const sessions = await safeRequest('/admin/api/logins');
        const vipCredentials = await safeRequest('/admin/api/vip-credentials');

        const totalUsers = Array.isArray(sessions) ? sessions.length : 0;
        const vipUsers = Array.isArray(sessions)
          ? sessions.filter((row) => Boolean(row && row.isVip)).length
          : 0;
        const vipMappings = Array.isArray(vipCredentials) ? vipCredentials.length : 0;

        countEl.textContent = sessions.length + ' sessions';
        vipCountEl.textContent = vipCredentials.length + ' records';
        totalUserCountEl.textContent = String(totalUsers);
        vipUserCountEl.textContent = String(vipUsers);
        vipMappingCountEl.textContent = String(vipMappings);
        lastUpdated.textContent = 'Last updated: ' + new Date().toLocaleString();

        renderSessions(Array.isArray(sessions) ? sessions : []);
        renderVipCredentials(Array.isArray(vipCredentials) ? vipCredentials : []);
      } catch (error) {
        if (String(error.message || '').includes('Admin authentication required')) {
          window.location.href = '/admin';
          return;
        }

        errorEl.textContent = error.message || 'Failed to load data.';
        errorEl.style.display = 'block';
        showNotice('error', 'Unable to refresh dashboard data. Please retry.');
      }
    }

    async function removeVipCredential(username) {
      if (!confirm('Delete VIP credential for ' + username + '?')) {
        return;
      }

      try {
        const result = await safeRequest('/admin/api/vip-credentials/' + encodeURIComponent(username), {
          method: 'DELETE'
        });

        if (result && result.action === 'deleted') {
          showNotice('success', 'VIP credential deleted for username: ' + username + '.');
        } else {
          showNotice('info', 'VIP credential not found for username: ' + username + '.');
        }

        load();
      } catch (error) {
        showNotice('error', error.message || 'Delete failed');
      }
    }

    document.getElementById('refresh').addEventListener('click', load);

    document.getElementById('vipForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      hideNotice();
      clearVipStatus();

      const username = document.getElementById('vipUsername').value.trim();
      const password = document.getElementById('vipPassword').value;
      const appid = document.getElementById('vipAppId').value.trim();
      const secret = document.getElementById('vipSecret').value;

      try {
        const result = await safeRequest('/admin/api/vip-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, appid, secret })
        });

        const actionLabel = (result && result.action === 'updated') ? 'updated' : 'created';
        const mappedAppId = (result && result.appid) ? result.appid : appid;

        showNotice(
          'success',
          'VIP credential ' + actionLabel + ' successfully. username=' + username + ', mapped appid=' + mappedAppId
        );
        showVipStatus(
          'success',
          'Success: VIP credential ' + actionLabel + '. username=' + username + ', appid=' + mappedAppId
        );

        document.getElementById('vipPassword').value = '';
        document.getElementById('vipSecret').value = '';
        load();
      } catch (error) {
        showVipStatus('error', 'Failed to save VIP credential: ' + (error.message || 'unknown error'));
        showNotice('error', error.message || 'Save failed');
      }
    });

    window.removeVipCredential = removeVipCredential;
    load();
  </script>
</body>
</html>`;
}

function createAdminRoutes() {
  const router = express.Router();

  router.get('/', (req, res) => {
    const admin = getAdminFromRequest(req);

    if (!admin) {
      res.type('html').send(buildLoginHtml());
      return;
    }

    res.type('html').send(buildDashboardHtml());
  });

  router.post('/login', asyncHandler(async (req, res) => {
    const username = req.body?.username;
    const password = req.body?.password;

    if (!username || !password) {
      const error = new Error('username and password are required');
      error.statusCode = 400;
      throw error;
    }

    const admin = await verifyAdminCredential(username, password);

    if (!admin) {
      const error = new Error('Invalid admin credentials');
      error.statusCode = 401;
      throw error;
    }

    const expiresAt = Date.now() + (config.adminAuth.sessionTtlSeconds * 1000);
    const token = createAdminToken({
      username: admin.username,
      role: admin.role,
      exp: expiresAt
    });

    setAdminCookie(res, token);

    res.json({
      username: admin.username,
      role: admin.role,
      expiresAt
    });
  }));

  router.post('/logout', (req, res) => {
    clearAdminCookie(res);
    res.json({ ok: true });
  });

  router.get('/logout', (req, res) => {
    clearAdminCookie(res);
    res.redirect('/admin');
  });

  router.get('/api/logins', requireAdminAuth, asyncHandler(async (req, res) => {
    const [rows, vipRows] = await Promise.all([
      listSessions(300),
      listVipCredentials(500)
    ]);

    const vipAppIds = new Set(vipRows.map((item) => item.appid));

    const sanitized = rows.map((item) => ({
      appid: item.appid || item.id || '',
      tenantName: item.tenantName || '',
      tenantId: item.tenantId || '',
      accessTokenMasked: maskToken(item.access_token),
      createdAt: item.createdAt || '',
      updatedAt: item.updatedAt || '',
      isVip: vipAppIds.has(item.appid)
    }));

    res.json(sanitized);
  }));

  router.get('/api/vip-credentials', requireAdminAuth, asyncHandler(async (req, res) => {
    const rows = await listVipCredentials(500);
    res.json(rows);
  }));

  router.post('/api/vip-credentials', requireAdminAuth, asyncHandler(async (req, res) => {
    const result = await upsertVipCredential({
      username: req.body?.username,
      password: req.body?.password,
      appid: req.body?.appid,
      secret: req.body?.secret
    });

    res.json(result);
  }));

  router.delete('/api/vip-credentials/:username', requireAdminAuth, asyncHandler(async (req, res) => {
    const result = await deleteVipCredential(req.params.username);
    res.json(result);
  }));

  return router;
}

module.exports = createAdminRoutes;
