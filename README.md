# ruijie-api-proxy

Node.js + Express API proxy project using CommonJS modules. This project mirrors a modular ruijie-proxy style architecture and forwards requests to an upstream API.

## Project structure

- `routes/` - Express route modules grouped by domain
- `modules/` - Clean architecture modules (incremental migration)
- `modules/compositionRoot.js` - central dependency wiring for controllers
- `infrastructure/` - Infrastructure adapters (Firebase session store)
- `docs/` - OpenAPI/Swagger definition
- `scripts/` - Utility shell scripts
- `helpers/` - Shared helper modules (upstream HTTP client)
- `middleware/` - Middleware modules (bearer auth, async handling)
- `firebase/` - Firebase Admin initialization setup

## Clean architecture status

The project now uses clean architecture across all domains.

- Migrated modules:
  - `modules/auth/`
  - `modules/voucher/`
  - `modules/package/`
  - `modules/client/`
- Each module follows:
  - `controllers/` - HTTP handlers
  - `useCases/` - business logic
  - `gateways/` - upstream integrations
  - `repositories/` - persistence adapters (when needed)
- Client routes include `auth`, `unauth`, and `suspected` filters.
- Domain logic is implemented in `modules/`; infrastructure concerns are in `infrastructure/`.

## Prerequisites

- Node.js 18+
- npm

## Setup

1. Install dependencies:
   - `npm install`
2. Copy environment file:
   - `cp .env.example .env`
3. Update `.env` values, especially:
   - `UPSTREAM_BASE_URL`
  - `RUIJIE_LOGIN_TOKEN` (default is fixed to `d63dss0a81e4415a889ac5b78fsc904a`)
   - Firebase credentials (`FIREBASE_SERVICE_ACCOUNT_PATH` or inline env values)
  - `FIREBASE_SESSION_COLLECTION` (defaults to `start`)
4. Start server:
   - `npm run dev`

## Available scripts

- `npm start` - run production mode
- `npm run dev` - run with nodemon
- `bash scripts/dev.sh` - install and run dev server
- `bash scripts/smoke.sh` - lightweight smoke check
- `bash scripts/e2e.sh` - login + package CRUD + voucher create/list/delete test flow
- `bash scripts/e2e-negative.sh` - intentionally wrong/negative test flow for proxy and uplink errors

### E2E test script

```bash
APPID="YOUR_APP_ID" SECRET="YOUR_APP_SECRET" bash scripts/e2e.sh
```

Optional envs:
- `BASE_URL` (default `http://localhost:3000`)
- `GROUP_ID` (if omitted, script auto-picks first synchronized group)
- `PACKAGE_NAME` (default `2h-e2e`)
- `PACKAGE_PRICE` (default `1000`)
- `VOUCHER_COUNT` (default `3`)
- `VOUCHER_STATUS` (default `3`, expire)

### Negative E2E script

Runs intentionally invalid requests to surface error handling from both proxy and uplink.

```bash
bash scripts/e2e-negative.sh
```

With real credentials (recommended for token-related failure checks):

```bash
APPID="YOUR_APP_ID" SECRET="YOUR_APP_SECRET" bash scripts/e2e-negative.sh
```

## API endpoints

### Auth/Core
- `POST /login` (alias)
- `POST /login/vip` (alias)
- `POST /auth/core/login`
- `POST /auth/core/vip-login`
- `GET /auth/core/projects`
- `GET /auth/core/tenant`

### Vouchers
- `GET /vouchers`
- `GET /vouchers/status`
- `POST /vouchers/generate`

### Packages
- `GET /packages`
- `POST /packages/create`
- `POST /packages/:groupId`
- `DELETE /packages/:uuid`

### Clients
- `GET /clients/auth`
- `GET /clients/unauth`
- `GET /clients/suspected`

## Swagger docs

After starting the server, open:

- `http://localhost:3000/docs`

Additional client integration doc:

- `docs/client-docs.md` (Client API + AI-friendly integration contracts)
- `docs/client-docs.ai.md` (AI-first deterministic contract copy)

## Admin dashboard

Small web dashboard for viewing login sessions and managing VIP login mapping.

- URL: `http://localhost:3000/admin`
- Data API: `GET /admin/api/logins`
- Login API: `POST /admin/login` with `{ "username", "password" }`
- Admin credentials are seeded into Firebase collection `admin_users` (configurable via `FIREBASE_ADMIN_COLLECTION`).
- VIP credentials API (requires admin login):
  - `GET /admin/api/vip-credentials`
  - `POST /admin/api/vip-credentials` with `{ "username", "password", "appid", "secret" }`
  - `DELETE /admin/api/vip-credentials/:username`
- VIP credentials are stored in Firebase collection `vip_credentials` (configurable via `FIREBASE_VIP_CREDENTIAL_COLLECTION`).

Default admin seed values (change in `.env` before production):

- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=admin12345`
- `ADMIN_SESSION_SECRET=change-this-admin-session-secret`

## Example curl commands

### 1) Login

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"appid":"YOUR_APP_ID","secret":"YOUR_APP_SECRET"}'
```

The login response includes:
- envelope fields: `success`, `message`, `data`, `meta`
- login payload in `data`:
  - `appid`
  - `secret`
  - `authorization` (format: `Bearer appid::token`)
  - `access_code` (`null`)

Use `data.authorization` directly for protected routes.

### 1.1) VIP Login

```bash
curl -X POST http://localhost:3000/login/vip \
  -H "Content-Type: application/json" \
  -d '{"username":"vip_user_1","password":"vip_password_1"}'
```

VIP login returns the same login payload and authorization format as normal `/login`.

## Response envelope

All API routes (except `/docs`) return a normalized envelope.

Success:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "message": "...",
  "error": {
    "httpStatus": 401,
    "details": {}
  }
}
```

Special mapped error:

- If uplink returns `voucherData.code=1014` (`Group has not been synchronized`), proxy maps it to:
  - HTTP `409`
  - `error.code = USERGROUP_NOT_SYNCED`
  - `error.resetRequired = true`
  - `error.nextAction = refresh_network_group_and_reselect`

## Detailed login flow

1. Client calls `POST /login` (or `POST /auth/core/login`) with `appid` and `secret`.
  - Alternative for end-user app auth: `POST /login/vip` (or `/auth/core/vip-login`) with VIP `username` and `password` mapped by admin.
2. Proxy calls upstream:
   - `POST /oauth20/client/access_token?token=<RUIJIE_LOGIN_TOKEN>`
3. Proxy extracts `access_token` from upstream response.
4. Proxy calls upstream tenant info:
  - `GET /org/tenant/info?access_token=<access_token>`
5. Proxy stores session to Firebase as:
   - Collection: `start` (or `FIREBASE_SESSION_COLLECTION`)
   - Document ID: `appid`
   - Document body:
     ```json
     {
       "access_token": "<token>",
       "appid": "<appid>",
     "secret": "<secret>",
     "tenantName": "<tenantName>",
     "tenantId": <tenantId>
     }
     ```
6. Proxy returns to client:
   ```json
   {
     "success": true,
     "message": "OK",
     "data": {
       "appid": "<appid>",
       "secret": "<secret>",
       "authorization": "Bearer <appid>::<access_token>",
       "access_code": null
     },
     "meta": {}
   }
   ```

### 2) Get projects

```bash
curl http://localhost:3000/auth/core/projects \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

### 3) Get tenant

```bash
curl http://localhost:3000/auth/core/tenant \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

### 4) Get vouchers

```bash
curl http://localhost:3000/vouchers \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

### 5) Generate vouchers

```bash
curl -X POST http://localhost:3000/vouchers/generate \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"count":10,"type":"daily"}'
```

### 5.1) Get voucher status summary

```bash
curl "http://localhost:3000/vouchers/status?groupId=GROUP_ID" \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

### 6) Get packages

```bash
curl "http://localhost:3000/packages?groupId=GROUP_ID" \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

### 7) Create package

```bash
curl -X POST http://localhost:3000/packages/create \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Starter Package","speed":"100Mbps"}'
```

### 8) Update package group

```bash
curl -X POST http://localhost:3000/packages/GROUP_ID \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Group"}'
```

### 9) Delete package

```bash
curl -X DELETE http://localhost:3000/packages/PACKAGE_UUID \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

### 10) Get authenticated clients

```bash
curl "http://localhost:3000/clients/auth?group_id=8597722&page_index=1&page_size=100" \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

### 11) Get unauthenticated clients

```bash
curl "http://localhost:3000/clients/unauth?group_id=8597722&page_index=1&page_size=100" \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

### 12) Get suspected clients

```bash
curl "http://localhost:3000/clients/suspected?group_id=8597722&page_index=1&page_size=100" \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

## Notes

- This proxy forwards payloads/query parameters to upstream endpoints.
- Ensure upstream endpoint paths match your target Ruijie service routes.
- Login sessions are stored in Firebase collection `start` (or your configured collection) with document id = `appid`.
- Stored session fields include: `access_token`, `appid`, `secret`, `tenantName`, `tenantId`.
