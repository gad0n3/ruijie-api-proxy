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
- Existing routes/endpoints remain unchanged.
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

### E2E test script

```bash
APPID="YOUR_APP_ID" SECRET="YOUR_APP_SECRET" bash scripts/e2e.sh
```

Optional envs:
- `BASE_URL` (default `http://localhost:3000`)
- `GROUP_ID` (auto-picks first from `/network_group` if omitted)
- `LANG` (default `en`)
- `PACKAGE_NAME` (default `2h-e2e`)
- `PACKAGE_PRICE` (default `1000`)
- `VOUCHER_COUNT` (default `3`)
- `VOUCHER_STATUS` (default `3`, expire)

## API endpoints

### Auth/Core
- `POST /login` (alias)
- `POST /auth/core/login`
- `GET /auth/core/projects`
- `GET /auth/core/tenant`

### Vouchers
- `GET /vouchers`
- `POST /vouchers/generate`

### Packages
- `GET /packages`
- `POST /packages/create`
- `POST /packages/:groupId`
- `DELETE /packages/:uuid`

### Clients
- `GET /clients/online`
- `POST /clients/offline`
- `GET /clients/current-users`

## Swagger docs

After starting the server, open:

- `http://localhost:3000/docs`

## Example curl commands

### 1) Login

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"appid":"YOUR_APP_ID","secret":"YOUR_APP_SECRET"}'
```

The login response includes:
- `appid`
- `secret`
- `authorization` (format: `Bearer appid::token`)
- `access_code` (`null`)

Use the returned `authorization` value directly for protected routes.

## Detailed login flow

1. Client calls `POST /login` (or `POST /auth/core/login`) with `appid` and `secret`.
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
     "appid": "<appid>",
     "secret": "<secret>",
     "authorization": "Bearer <appid>::<access_token>",
     "access_code": null
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

### 6) Get packages

```bash
curl http://localhost:3000/packages \
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

### 10) Get online clients

```bash
curl http://localhost:3000/clients/online \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

### 11) Set clients offline

```bash
curl -X POST http://localhost:3000/clients/offline \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clientIds":["abc123","def456"]}'
```

### 12) Get current users

```bash
curl http://localhost:3000/clients/current-users \
  -H "Authorization: Bearer APPID::ACCESS_TOKEN"
```

## Notes

- This proxy forwards payloads/query parameters to upstream endpoints.
- Ensure upstream endpoint paths match your target Ruijie service routes.
- Login sessions are stored in Firebase collection `start` (or your configured collection) with document id = `appid`.
- Stored session fields include: `access_token`, `appid`, `secret`, `tenantName`, `tenantId`.
