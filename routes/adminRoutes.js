const crypto = require("crypto");
const express = require("express");
const config = require("../config");
const { asyncHandler } = require("../middleware");
const { createSessionRepository } = require("../infrastructure/sessionStore");
const { verifyAdminCredential } = require("../infrastructure/adminStore");
const {
  listVipCredentials,
  upsertVipCredential,
  deleteVipCredential,
} = require("../infrastructure/vipCredentialStore");
const { ValidationError, AuthenticationError } = require("../helpers/AppError");
const logger = require("../helpers/logger");

const sessionRepository = createSessionRepository();
const COOKIE_NAME = "admin_token";

/**
 * Masks sensitive parts of a token for display.
 * @param {string} token
 * @returns {string}
 */
function maskToken(token) {
  const value = String(token || "");
  if (value.length <= 10) return value;
  return value.slice(0, 6) + "..." + value.slice(-4);
}

/**
 * Parses cookies from a raw header string.
 * @param {string} cookieHeader
 * @returns {object}
 */
function parseCookies(cookieHeader) {
  const source = String(cookieHeader || "");
  const out = {};

  source.split(";").forEach((entry) => {
    const idx = entry.indexOf("=");
    if (idx <= 0) return;
    const key = entry.slice(0, idx).trim();
    const val = entry.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });

  return out;
}

/**
 * Signs a payload with the admin session secret.
 * @param {string} payload
 * @returns {string}
 */
function signPayload(payload) {
  return crypto
    .createHmac("sha256", config.adminAuth.sessionSecret)
    .update(payload)
    .digest("hex");
}

/**
 * Creates a signed JWT-like token for admin sessions.
 * @param {object} payloadObject
 * @returns {string}
 */
function createAdminToken(payloadObject) {
  const payload = Buffer.from(JSON.stringify(payloadObject), "utf8").toString(
    "base64url",
  );
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

/**
 * Verifies an admin token and returns the decoded payload if valid.
 * @param {string} token
 * @returns {object|null}
 */
function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expected = signPayload(payload);

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const decoded = JSON.parse(json);

    if (
      !decoded ||
      !decoded.username ||
      !decoded.exp ||
      Date.now() > decoded.exp
    ) {
      return null;
    }

    return decoded;
  } catch (e) {
    return null;
  }
}

/**
 * Sets the admin authentication cookie on the response.
 * @param {import('express').Response} res
 * @param {string} token
 */
function setAdminCookie(res, token) {
  const maxAge = config.adminAuth.sessionTtlSeconds;
  const isProd = config.isProduction;

  const cookieParts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (isProd) {
    cookieParts.push("Secure");
  }

  res.setHeader("Set-Cookie", cookieParts.join("; "));
}

/**
 * Clears the admin authentication cookie.
 * @param {import('express').Response} res
 */
function clearAdminCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

/**
 * Extracts the admin payload from the request cookies.
 * @param {import('express').Request} req
 * @returns {object|null}
 */
function getAdminFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  return verifyAdminToken(token);
}

/**
 * Middleware to require admin authentication.
 * @throws {AuthenticationError} If the admin is not authenticated.
 */
function requireAdminAuth(req, res, next) {
  const admin = getAdminFromRequest(req);

  if (!admin) {
    throw new AuthenticationError("Admin authentication required");
  }

  req.admin = admin;
  next();
}

/**
 * Escapes HTML characters.
 * @param {string} unsafe
 * @returns {string}
 */
function escapeHtml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildLoginHtml() {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Admin Login - Ruijie Proxy</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
        .login-card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        h1 { margin-top: 0; color: #1a73e8; font-size: 1.5rem; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #5f6368; }
        input { width: 100%; padding: 0.75rem; border: 1px solid #dadce0; border-radius: 4px; box-sizing: border-box; font-size: 1rem; }
        input:focus { outline: none; border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26,115,232,0.2); }
        button { width: 100%; padding: 0.75rem; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: 500; transition: background 0.2s; }
        button:hover { background: #1557b0; }
        #error { color: #d93025; background: #fce8e6; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.875rem; display: none; }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>Ruijie Proxy Admin</h1>
        <div id="error"></div>
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" autocomplete="username" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" autocomplete="current-password" required>
            </div>
            <button type="submit">Login</button>
        </form>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error');

            try {
                const res = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const payload = await res.json();

                if (payload.success === false) {
                    errorDiv.innerText = payload.message || 'Login failed';
                    errorDiv.style.display = 'block';
                } else {
                    window.location.reload();
                }
            } catch (err) {
                errorDiv.innerText = 'Network error. Please try again.';
                errorDiv.style.display = 'block';
            }
        });
    </script>
</body>
</html>
`;
}

function buildDashboardHtml() {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard - Ruijie Proxy</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; background: #f8f9fa; color: #3c4043; }
        nav { background: #1a73e8; color: white; padding: 0.75rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(60,64,67,0.3); margin-bottom: 2rem; }
        h2 { margin-top: 0; font-size: 1.25rem; border-bottom: 1px solid #eee; padding-bottom: 0.75rem; color: #202124; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
        th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #f1f3f4; }
        th { background: #f8f9fa; color: #5f6368; font-weight: 500; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
        .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
        .badge-vip { background: #e8f0fe; color: #1a73e8; }
        .actions { display: flex; gap: 1rem; }
        button { border-radius: 4px; padding: 0.5rem 1rem; font-size: 0.875rem; cursor: pointer; font-weight: 500; transition: background 0.2s; border: none; }
        button.primary { background: #1a73e8; color: white; }
        button.primary:hover { background: #1557b0; }
        button.danger { background: #fce8e6; color: #d93025; }
        button.danger:hover { background: #f9d2ce; }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(32,33,36,0.6); align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 450px; box-shadow: 0 12px 24px rgba(0,0,0,0.2); }
        .form-row { margin-bottom: 1.25rem; }
        .form-row label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #5f6368; font-size: 0.875rem; }
        .form-row input { width: 100%; padding: 0.625rem; border: 1px solid #dadce0; border-radius: 4px; box-sizing: border-box; font-size: 1rem; }
        code { background: #f1f3f4; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: "Roboto Mono", monospace; font-size: 0.8rem; }
    </style>
</head>
<body>
    <nav>
        <strong>Ruijie Proxy Admin</strong>
        <div class="actions">
            <a href="/admin/logout" style="color: white; text-decoration: none; font-weight: 500;">Logout</a>
        </div>
    </nav>
    <div class="container">
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>VIP Mappings</h2>
                <button class="primary" onclick="showAddVipModal()">Add VIP Mapping</button>
            </div>
            <table id="vipTable">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Mapped AppID</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="vipBody">
                    <tr><td colspan="4">Loading...</td></tr>
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>Active Login Sessions</h2>
            <table id="sessionTable">
                <thead>
                    <tr>
                        <th>AppID</th>
                        <th>Tenant Info</th>
                        <th>Last Activity</th>
                        <th>Upstream Token (Masked)</th>
                    </tr>
                </thead>
                <tbody id="sessionBody">
                    <tr><td colspan="4">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div id="vipModal" class="modal">
        <div class="modal-content">
            <h2 id="modalTitle">Add VIP Mapping</h2>
            <form id="vipForm">
                <div class="form-row">
                    <label>VIP Username (used for /login/vip)</label>
                    <input type="text" id="vipUser" required>
                </div>
                <div class="form-row">
                    <label>VIP Password</label>
                    <input type="password" id="vipPass" required>
                </div>
                <div class="form-row">
                    <label>Ruijie AppID</label>
                    <input type="text" id="vipAppId" required>
                </div>
                <div class="form-row">
                    <label>Ruijie Secret</label>
                    <input type="password" id="vipSecret" required>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                    <button type="button" onclick="hideVipModal()">Cancel</button>
                    <button type="submit" class="primary">Save Mapping</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        async function loadData() {
            try {
                const res = await fetch('/admin/api/logins');
                const sessionPayload = await res.json();
                const sessionBody = document.getElementById('sessionBody');

                if (sessionPayload.success && Array.isArray(sessionPayload.data)) {
                    sessionBody.innerHTML = sessionPayload.data.map(s => \`
                        <tr>
                            <td>\${s.isVip ? '<span class="badge badge-vip">VIP</span> ' : ''}\${s.appid}</td>
                            <td>\${s.tenantName} <br><small style="color: #5f6368">ID: \${s.tenantId}</small></td>
                            <td>\${s.updatedAt || s.createdAt}</td>
                            <td><code>\${s.accessTokenMasked}</code></td>
                        </tr>
                    \`).join('') || '<tr><td colspan="4">No sessions found</td></tr>';
                }

                const vipRes = await fetch('/admin/api/vip-credentials');
                const vipPayload = await vipRes.json();
                const vipBody = document.getElementById('vipBody');

                if (vipPayload.success && Array.isArray(vipPayload.data)) {
                    vipBody.innerHTML = vipPayload.data.map(v => \`
                        <tr>
                            <td>\${v.username}</td>
                            <td>\${v.appid}</td>
                            <td>\${v.updatedAt || v.createdAt || '-'}</td>
                            <td><button class="danger" onclick="deleteVip('\${v.username}')">Delete</button></td>
                        </tr>
                    \`).join('') || '<tr><td colspan="4">No VIP mappings configured</td></tr>';
                }
            } catch (err) {
                console.error('Dashboard data fetch failed', err);
            }
        }

        function showAddVipModal() {
            document.getElementById('vipForm').reset();
            document.getElementById('vipModal').style.display = 'flex';
        }

        function hideVipModal() {
            document.getElementById('vipModal').style.display = 'none';
        }

        async function deleteVip(username) {
            if (!confirm(\`Are you sure you want to remove the VIP mapping for "\${username}"?\`)) return;
            try {
                const res = await fetch(\`/admin/api/vip-credentials/\${username}\`, { method: 'DELETE' });
                const payload = await res.json();
                if (payload.success) {
                    loadData();
                } else {
                    alert(payload.message || 'Deletion failed');
                }
            } catch (err) {
                alert('Network error during deletion');
            }
        }

        document.getElementById('vipForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                username: document.getElementById('vipUser').value,
                password: document.getElementById('vipPass').value,
                appid: document.getElementById('vipAppId').value,
                secret: document.getElementById('vipSecret').value
            };
            try {
                const res = await fetch('/admin/api/vip-credentials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const payload = await res.json();
                if (payload.success) {
                    hideVipModal();
                    loadData();
                } else {
                    alert(payload.message || 'Failed to save mapping');
                }
            } catch (err) {
                alert('Network error while saving');
            }
        });

        loadData();
    </script>
</body>
</html>
`;
}

function createAdminRoutes() {
  const router = express.Router();

  /**
   * Main Admin Dashboard entry point.
   */
  router.get("/", (req, res) => {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      res.type("html").send(buildLoginHtml());
      return;
    }
    res.type("html").send(buildDashboardHtml());
  });

  /**
   * Admin Login endpoint.
   */
  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const { username, password } = req.body || {};

      if (!username || !password) {
        throw new ValidationError("Username and password are required.");
      }

      const admin = await verifyAdminCredential(username, password);

      if (!admin) {
        throw new AuthenticationError("Invalid admin credentials.");
      }

      const expiresAt = Date.now() + config.adminAuth.sessionTtlSeconds * 1000;
      const token = createAdminToken({
        username: admin.username,
        role: admin.role,
        exp: expiresAt,
      });

      setAdminCookie(res, token);

      logger.info("[AdminAuth] Admin login successful", {
        username: admin.username,
      });

      res.json({
        username: admin.username,
        role: admin.role,
        expiresAt,
      });
    }),
  );

  /**
   * Logout endpoint (POST).
   */
  router.post("/logout", (req, res) => {
    clearAdminCookie(res);
    res.json({ success: true, message: "Logged out successfully" });
  });

  /**
   * Logout endpoint (GET redirect).
   */
  router.get("/logout", (req, res) => {
    clearAdminCookie(res);
    res.redirect("/admin");
  });

  /**
   * API: List all login sessions.
   */
  router.get(
    "/api/logins",
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const [rows, vipRows] = await Promise.all([
        sessionRepository.listAll(300),
        listVipCredentials(500),
      ]);

      const vipAppIds = new Set(vipRows.map((item) => item.appid));

      const sanitized = rows.map((item) => ({
        appid: item.appid || item.id || "",
        tenantName: item.tenantName || "",
        tenantId: item.tenantId || "",
        accessTokenMasked: maskToken(item.access_token),
        createdAt: item.createdAt || "",
        updatedAt: item.updatedAt || "",
        isVip: vipAppIds.has(item.appid),
      }));

      res.json(sanitized);
    }),
  );

  /**
   * API: List all VIP credential mappings.
   */
  router.get(
    "/api/vip-credentials",
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const rows = await listVipCredentials(500);
      res.json(rows);
    }),
  );

  /**
   * API: Create or update a VIP credential mapping.
   */
  router.post(
    "/api/vip-credentials",
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const { username, password, appid, secret } = req.body || {};

      const result = await upsertVipCredential({
        username,
        password,
        appid,
        secret,
      });

      logger.info("[AdminAuth] VIP credential mapping updated", {
        username,
        updatedBy: req.admin.username,
      });

      res.json(result);
    }),
  );

  /**
   * API: Delete a VIP credential mapping.
   */
  router.delete(
    "/api/vip-credentials/:username",
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const result = await deleteVipCredential(req.params.username);

      logger.info("[AdminAuth] VIP credential mapping deleted", {
        username: req.params.username,
        deletedBy: req.admin.username,
      });

      res.json(result);
    }),
  );

  return router;
}

module.exports = createAdminRoutes;
