# Ruijie API Proxy (Client API Docs)

This guide is the client integration companion to `docs/openapi.yaml`.
It is optimized for app client implementation and AI-assisted code generation.

## Client Release Notes

Apply these client-side updates:

1. All API routes use envelope responses:
  - success: `{ success, message, data, meta }`
  - error: `{ success:false, message, error:{ httpStatus, details } }`
2. Read login token from `response.data.data.authorization`.
3. Do not send `lang` from client requests.
4. `GET /packages` now accepts only `groupId`.
  - Server fixes upstream pagination to `pageIndex=1`, `pageSize=20`.
5. New endpoint: `GET /vouchers/status?groupId=`.
6. Client traffic fields changed:
  - `flowUp` and `flowDown` are formatted strings with `-MB` / `-GB` suffix.
  - `duration` is `HH:MM`.
  - `flowUpDown` is removed from suspected client response payload.
7. Unsynchronized group mapping is stable:
  - uplink `voucherData.code=1014` -> HTTP `409`
  - `error.code=USERGROUP_NOT_SYNCED`
  - `error.resetRequired=true`
  - `error.nextAction=refresh_network_group_and_reselect`
8. VIP login is supported for client apps:
  - `POST /login/vip` (alias `POST /auth/core/vip-login`)
  - request body: `{ username, password }`
  - server maps VIP credentials to stored `appid/secret` and returns normal login response.

## Base URL

- Local: `http://localhost:3000`
- Production: `https://<your-server-host>`

## Authentication

1. Call `POST /login` with `appid` and `secret`.
  - Alternative: call `POST /login/vip` with VIP `username` and `password`.
2. Read `authorization` from `response.data.data.authorization`.
3. Send it as `Authorization` header on protected endpoints.

Header format:

```http
Authorization: Bearer <appid>::<access_token>
```

---

## Quick Endpoint Map

### Auth
- `POST /login`
- `POST /login/vip`
- `POST /auth/core/login` (alias)
- `POST /auth/core/vip-login` (alias)

### Admin (Dashboard only)
- `POST /admin/login`
- `GET /admin/api/logins`
- `GET /admin/api/vip-credentials`
- `POST /admin/api/vip-credentials`
- `DELETE /admin/api/vip-credentials/{username}`

### Network Group
- `GET /network_group`

### Packages (Usergroup)
- `GET /packages?groupId=`
- `POST /packages/create`
- `POST /packages/{groupId}`
- `DELETE /packages/{uuid}?groupId=&packageId=&authProfileId=`

### Vouchers
- `GET /vouchers?groupId=&status=&start=&pageSize=`
- `GET /vouchers/status?groupId=`
- `POST /vouchers/generate`
- `DELETE /vouchers/expired?groupId=`

### Clients
- `GET /clients/auth?group_id=&page_index=&page_size=`
- `GET /clients/unauth?group_id=&page_index=&page_size=`
- `GET /clients/suspected?group_id=&page_index=&page_size=`

---

## AI Handoff: Deterministic API Flow

Use this section as machine-readable behavior guidance for another AI agent.

### Required runtime state (client side)

```json
{
  "baseUrl": "http://localhost:3000",
  "authorization": "Bearer <appid>::<access_token>",
  "selectedGroupId": 8597889,
  "selectedPackage": {
    "id": 504690,
    "authProfileId": "07271539267689731897455769202751"
  }
}
```

### Strict execution order

1. `POST /login` with `{ appid, secret }`.
2. Read token from `response.data.data.authorization` and store it.
3. Call `GET /network_group` with `Authorization` header.
4. Pick `groupId`.
5. Call `GET /packages?groupId=...`.
6. If creating vouchers: resolve `package.id` + `package.authProfileId`.
7. Call `POST /vouchers/generate`.
8. Optionally call `GET /vouchers`, `GET /vouchers/status`, and `DELETE /vouchers/expired`.
9. For client monitor screens, call `/clients/auth|unauth|suspected`.

Language note:
- Client does not send `lang`.
- Server applies default language internally (`en`).

Packages list pagination note:
- Client does not send `pageIndex` or `pageSize`.
- Server uses fixed upstream values: `pageIndex=1`, `pageSize=20`.

### Response parsing rules (must-follow)

1. Every API response is an envelope: `{ success, message, data, meta }`.
2. Business payload is always `response.data` (inside envelope).
3. Never read top-level fields like `authorization` directly from root response.
4. Error envelope is `{ success:false, message, error:{ httpStatus, details } }`.

### Endpoint I/O summary for AI agents

| Step | Endpoint | Auth header | Request body/query | Read from `response.data` |
|---|---|---|---|---|
| 1 | `POST /login` | No | body: `appid`, `secret` | `authorization` |
| 1a | `POST /login/vip` | No | body: `username`, `password` | `authorization` |
| 2 | `GET /network_group` | Yes | none | `Array<{name, groupId}>` |
| 3 | `GET /packages` | Yes | query: `groupId` | object with package rows |
| 4 | `POST /packages/create` | Yes | package payload | created package object |
| 5 | `POST /packages/{groupId}` | Yes | update payload | `{code,msg}` style payload |
| 6 | `DELETE /packages/{uuid}` | Yes | query: `groupId,packageId,authProfileId` | `{code,msg}` style payload |
| 7 | `POST /vouchers/generate` | Yes | body: `groupId,userGroupId,profile,count` | `{count,list}` |
| 8 | `GET /vouchers` | Yes | query: `groupId,status,start,pageSize` | `Array<Voucher>` |
| 9 | `GET /vouchers/status` | Yes | query: `groupId` | `{expired,total,used}` |
| 10 | `DELETE /vouchers/expired` | Yes | query: `groupId`; body array | `{code,msg,deletedCount,batchCount}` |
| 11 | `GET /clients/auth|unauth|suspected` | Yes | query: `group_id,page_index,page_size` | `Array<ClientRow>` |

---

## Client Response Contract

All API endpoints now return a consistent envelope from the server (including `/demo/*` and `/health`).

### Success envelope

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```

### Error envelope

```json
{
  "success": false,
  "message": "Human readable message",
  "error": {
    "httpStatus": 400,
    "details": {}
  }
}
```

### Data mapping used by server

| Endpoint group | Internal source shape | Returned `data` |
|---|---|---|
| Login | object | full object |
| Network Group | array | same array |
| Package list | `{ code, msg, data, count }` | `data` array, with `meta.count` |
| Package create | object | full object |
| Package update/delete | `{ code, msg }` | full object |
| Voucher list | array | same array |
| Voucher generate | `{ count, list }` | full object |
| Voucher delete | `{ code, msg, deletedCount, batchCount }` | full object |
| Clients auth/unauth/suspected | `{ list: [] }` | `list` array |

---

## Uplink Integration Reference

Proxy uplink configuration:
- Base URL comes from `UPSTREAM_BASE_URL` (or `RUIJIE_UPSTREAM_BASE_URL` / `UPSTREAM_URL`)
- Timeout comes from `UPSTREAM_TIMEOUT_MS`

Uplink auth behavior:
- Proxy login uplink call uses request headers `appid` and `secret`
- Protected uplink calls use `Authorization: Bearer <access_token>` plus query `access_token`
- For composite client token `Bearer <appid>::<access_token>`, proxy resolves Firebase session (`start/{appid}`)

Proxy to uplink path map:

| Proxy API | Uplink API |
|---|---|
| `POST /login` | `POST /oauth20/client/access_token?token=<RUIJIE_LOGIN_TOKEN>` |
| login tenant sync | `GET /org/tenant/info?access_token=` |
| `GET /network_group` | `GET /group/single/tree?access_token=` |
| `GET /packages` | `GET /intl/usergroup/list/{groupId}` |
| `POST /packages/create` | `POST /intlSamProfile/create/{tenant}/{tenant}/{groupId}` then `POST /intl/usergroup/group/{groupId}` |
| `POST /packages/{groupId}` | `POST /intlSamProfile/update/{tenant}/{tenant}/{groupId}` then `PUT /intl/usergroup/group/{groupId}` |
| `DELETE /packages/{uuid}` | `DELETE /intl/usergroup/group/{groupId}` then `DELETE /intlSamProfile/delete/{authProfileId}` |
| `GET /vouchers` | `GET /intlSamVoucher/getList/{tenantName}/{groupId}` |
| `GET /vouchers/status` | `GET /intlSamVoucher/getStatus/{tenantName}/{groupId}` |
| `POST /vouchers/generate` | `POST /intlSamVoucher/create/{tenant}/{tenant}/{groupId}` |
| `DELETE /vouchers/expired` | `DELETE /intlSamVoucher/v2/delete` |
| `GET /clients/*` | `GET /open/v1/dev/user/current-user` |

---

## Canonical Request/Response Contracts

All endpoint samples below show the payload inside response `data`.
Actual HTTP response is wrapped by the global envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": {"...": "payload shown below"},
  "meta": {}
}
```

## 1) Login

`POST /login`

### Request

```json
{
  "appid": "opena305a89b2d79",
  "secret": "63899898099e42c3b5bfef8d9325e008"
}
```

### Response

```json
{
  "appid": "opena305a89b2d79",
  "secret": "63899898099e42c3b5bfef8d9325e008",
  "authorization": "Bearer opena305a89b2d79::RFH8oE1I0n1p2n5of6d3k5p8n4U8oC3j",
  "access_code": null
}
```

## 1.1) VIP Login

`POST /login/vip` (alias `POST /auth/core/vip-login`)

### Request

```json
{
  "username": "vip_user_1",
  "password": "vip_password_1"
}
```

### Response

Same as login response. The proxy resolves VIP credentials to mapped `appid/secret` and returns:

```json
{
  "appid": "opena305a89b2d79",
  "secret": "63899898099e42c3b5bfef8d9325e008",
  "authorization": "Bearer opena305a89b2d79::RFH8oE1I0n1p2n5of6d3k5p8n4U8oC3j",
  "access_code": null
}
```

---

## 2) Network Group List (leaf only)

`GET /network_group`

### Response

```json
[
  { "name": "BridgeDemo3", "groupId": 8597889 },
  { "name": "SMB_GeneralDemo2", "groupId": 8597888 }
]
```

---

## 3) Packages List

`GET /packages?groupId=8597889`

### Response (proxy-through shape from upstream)

```json
{
  "code": 0,
  "msg": "OK.",
  "data": [
    {
      "id": 504690,
      "userGroupName": "5h",
      "authProfileId": "07271539267689731897455769202751",
      "name": "5h",
      "groupId": 8597889,
      "noOfDevice": 1
    }
  ],
  "count": 1
}
```

---

## 4) Create Package (2-step orchestration)

`POST /packages/create`

### Request

```json
{
  "noOfDevice": 1,
  "timePeriod": 0,
  "quota": 0,
  "uploadRateLimit": 10240,
  "downloadRateLimit": 10240,
  "durationCtrlType": 0,
  "timePeriodTotal": 0,
  "timePeriodDaily": 60,
  "timePeriodDailyCustom": 60,
  "limitedTimes": 0,
  "userGroupName": "2h",
  "price": "1000",
  "bindMac": 1,
  "kickOffType": 1,
  "packageType": "COMMON",
  "groupId": 8597889,
  "name": "2h",
  "isBindSsid": 0
}
```

### Response (simplified)

```json
{
  "id": 504694,
  "noOfDevice": 1,
  "timePeriod": 0,
  "quota": 0,
  "uploadRateLimit": 10240,
  "downloadRateLimit": 10240,
  "durationCtrlType": 0,
  "timePeriodTotal": 0,
  "limitedTimes": 0,
  "price": "1000",
  "bindMac": 1,
  "kickOffType": 1,
  "groupId": 8597889,
  "name": "2h"
}
```

---

## 5) Update Package (2-step orchestration)

`POST /packages/{groupId}`

### Request

Include at least:

```json
{
  "id": 504690,
  "groupId": 8597889,
  "name": "5h",
  "userGroupName": "5h",
  "authProfileId": "07271539267689731897455769202751"
}
```

### Response

```json
{
  "code": 0,
  "msg": "OK."
}
```

---

## 6) Delete Package (2-step orchestration)

`DELETE /packages/{uuid}?groupId=8597889&packageId=504694&authProfileId=55395712657796200634438859765701`

- `uuid`: auth profile id (same as `authProfileId` when available)

### Response

```json
{
  "code": 0,
  "msg": "OK."
}
```

---

## 7) Voucher List (status filter)

`GET /vouchers?groupId=8597889&status=1&start=0&pageSize=100`

- `status`: `1` Unused, `2` Inuse, `3` Expire

### Response (simplified list)

```json
[
  {
    "voucherCode": "zy4xt23pp",
    "timePeriod": 0,
    "maxClients": 1,
    "status": "1",
    "packagePrice": 1000,
    "bindMac": 1,
    "packageName": "5h",
    "userGroupId": "504690",
    "disableStatus": 0,
    "price": "1000ကျပ်",
    "dl_speed": "10Mbps",
    "ul_speed": "10Mbps",
    "duration": "Unlimited"
  }
]
```

---

## 8) Create Vouchers

`POST /vouchers/generate`

### Request

```json
{
  "groupId": 8597889,
  "userGroupId": 504690,
  "profile": "35701109567871531697785108416329",
  "count": 3
}
```

### Response (simplified)

```json
{
  "count": 3,
  "list": [
    {
      "uuid": "6236ee6623554c8caccefeb7bdddd741",
      "voucherCode": "wtia35r5v",
      "status": "1",
      "profileId": "35701109567871531697785108416329",
      "expiryTime": "2125-03-05 08:23:22"
    }
  ]
}
```

---

## 9) Voucher Status Summary

`GET /vouchers/status?groupId=8597889`

### Response

```json
{
  "expired": 0,
  "total": 10,
  "used": 0
}
```

---

## 10) Delete Expired Vouchers (batch)

`DELETE /vouchers/expired?groupId=8597889`

### Request body

```json
[
  { "uuid": "e7576c2f12a24a789aff7d36858200e8", "voucherCode": "wsw4xyp" },
  { "uuid": "b2ad2510c28a415ea2fe185fcf490c45", "voucherCode": "xehm8ur" }
]
```

### Response

```json
{
  "code": 0,
  "msg": "Success.",
  "deletedCount": 2,
  "batchCount": 1
}
```

---

## 11) Authenticated Clients

`GET /clients/auth?group_id=8597722&page_index=1&page_size=100`

### Response

```json
{
  "list": [
    {
      "mac": "ff10.1510.511a",
      "ip": "192.168.4.241",
      "flowUp": "2.21-GB",
      "flowDown": "2.20-GB",
      "activeSec": 8061,
      "duration": "02:14",
      "staModel": "OPPO K11",
      "authMac": false,
      "account": "gu8qx2"
    }
  ]
}
```

---

## 12) Unauthenticated Clients

`GET /clients/unauth?group_id=8597722&page_index=1&page_size=100`

### Response

```json
{
  "list": [
    {
      "mac": "ff10.1610.511d",
      "ip": "192.168.4.215",
      "flowUp": "2.20-GB",
      "flowDown": "2.25-GB",
      "activeSec": 8018,
      "duration": "02:13",
      "staModel": "Redmi Note12 Turbo",
      "authMac": false,
      "account": null
    }
  ]
}
```

---

## 13) Suspected Clients

`GET /clients/suspected?group_id=8597722&page_index=1&page_size=100`

### Response

```json
{
  "list": [
    {
      "mac": "ff10.1610.511d",
      "ip": "192.168.4.215",
      "flowUp": "2.20-GB",
      "flowDown": "2.25-GB",
      "activeSec": 8018,
      "duration": "02:13",
      "staModel": "Redmi Note12 Turbo",
      "authMac": false,
      "account": null
    }
  ]
}
```

---

## Flutter Integration Notes

- Use your own client implementation for login and endpoint calls.
- Read token from `response.data.data.authorization`.
- Parse business payload from `response.data.data`.

---

## Error Handling Contract

Server error payload (actual API response):

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

Recommended Flutter handling:
- treat non-2xx as failure
- parse `message` for user-friendly toast/dialog
- log `error.details` for diagnostics only

Stable error mapping note:
- Uplink business error `voucherData.code=1014` is mapped to HTTP `409` with `error.code=USERGROUP_NOT_SYNCED`.
- Client should follow `error.nextAction` when present.

### Usergroup Not Synchronized (uplink code 1014)

When uplink responds with `voucherData.code = 1014` (example message: `Group has not been synchronized`), treat it as a reset-required client state.

Typical error envelope:

```json
{
  "success": false,
  "message": "Selected usergroup is not synchronized yet.",
  "error": {
    "httpStatus": 409,
    "code": "USERGROUP_NOT_SYNCED",
    "resetRequired": true,
    "nextAction": "refresh_network_group_and_reselect",
    "details": {
      "code": 0,
      "msg": "OK.",
      "voucherData": {
        "code": 1014,
        "msg": "Group has not been synchronized"
      }
    }
  }
}
```

Client reset flow:

1. Clear selected `groupId`.
2. Clear selected package/usergroup state (`packageId`, `authProfileId`, related cached package rows).
3. Reload groups via `GET /network_group`.
4. Recheck candidate group with `GET /vouchers/status?groupId=...`.
5. Proceed only when status call succeeds.

### Client normalizer behavior

- On success, expect envelope: `success=true`, then read payload from `data`.
- On failure, expect envelope: `success=false`, then read `message` and `error.details`.

---

## Demo Mode (Lower Section)

Use this section when frontend/client work should run without upstream connectivity.
Demo endpoints are under `/demo` and still follow the same response envelope.

### Demo base URL

- `http://localhost:3000/demo`

### Demo quick map

- `POST /demo/login`
- `GET /demo/network_group`
- `GET /demo/packages?groupId=`
- `POST /demo/packages/create`
- `POST /demo/packages/{groupId}`
- `DELETE /demo/packages/{uuid}?groupId=&packageId=&authProfileId=`
- `GET /demo/vouchers?groupId=&status=&start=&pageSize=`
- `GET /demo/vouchers/status?groupId=`
- `POST /demo/vouchers/generate`
- `DELETE /demo/vouchers/expired?groupId=`
- `GET /demo/clients/auth?group_id=&page_index=&page_size=`
- `GET /demo/clients/unauth?group_id=&page_index=&page_size=`
- `GET /demo/clients/suspected?group_id=&page_index=&page_size=`

### Demo flow

1. `POST /demo/login`
2. Read token from `response.data.data.authorization`
3. `GET /demo/network_group` and choose `groupId`
4. `GET /demo/packages?groupId=...`
5. Optional: `POST /demo/vouchers/generate`
6. Optional: `GET /demo/vouchers?groupId=...`
7. Optional: `GET /demo/vouchers/status?groupId=...`
8. `GET /demo/clients/auth|unauth|suspected?group_id=...`

### Demo implementation notes

- Use the same envelope parsing rules as production routes.
- Follow the demo flow steps above in your client implementation.

### Demo notes

- Demo data is in-memory and resets when the server restarts.
- Client should not send `lang`; server uses default language internally.
