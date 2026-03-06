# Ruijie API Proxy (AI Contract Copy)

This file is an AI-first companion to `docs/client-docs.md`.
Use this as machine-readable integration rules for app clients.

## 1) Global Rules

- Base URL: `http://localhost:3000` (local)
- Auth header format: `Authorization: Bearer <appid>::<access_token>`
- Do not send `lang` from client.
- `/packages` client query uses only `groupId`.
- Server-fixed upstream pagination for packages: `pageIndex=1`, `pageSize=20`.

## 2) Response Envelope

All API endpoints (except `/docs`) return one envelope.

Success envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```

Error envelope:

```json
{
  "success": false,
  "message": "...",
  "error": {
    "httpStatus": 400,
    "details": {}
  }
}
```

Parsing rules:

1. Read business payload from `response.data.data`.
2. Do not read top-level `authorization`.
3. For errors, read `response.data.message` and `response.data.error`.

## 3) Stable Business Error Mapping

Unsynchronized usergroup mapping:

- Condition: uplink `voucherData.code == 1014`
- Proxy response:
  - `httpStatus = 409`
  - `error.code = USERGROUP_NOT_SYNCED`
  - `error.resetRequired = true`
  - `error.nextAction = refresh_network_group_and_reselect`

Example:

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

Required client reset flow:

1. Clear selected `groupId`.
2. Clear selected package state (`packageId`, `authProfileId`, cached package rows).
3. Reload groups: `GET /network_group`.
4. Recheck with `GET /vouchers/status?groupId=...`.
5. Continue only if status call succeeds.

## 4) Endpoint Contract Table

| Endpoint | Auth | Client Input | Output in `data` |
|---|---|---|---|
| `POST /login` | No | body: `appid`, `secret` | `{ appid, secret, authorization, access_code }` |
| `POST /login/vip` | No | body: `username`, `password` | `{ appid, secret, authorization, access_code }` |
| `POST /auth/core/login` | No | body: `appid`, `secret` | same as `/login` |
| `POST /auth/core/vip-login` | No | body: `username`, `password` | same as `/login/vip` |
| `GET /network_group` | Yes | none | `Array<{name, groupId}>` |
| `GET /packages` | Yes | query: `groupId` | upstream package object with `data[]` and `count` |
| `POST /packages/create` | Yes | package payload | created package object |
| `POST /packages/{groupId}` | Yes | update payload | `{ code, msg }` |
| `DELETE /packages/{uuid}` | Yes | query: `groupId,packageId,authProfileId` | `{ code, msg }` |
| `GET /vouchers` | Yes | query: `groupId,status,start,pageSize` | `Array<Voucher>` |
| `GET /vouchers/status` | Yes | query: `groupId` | `{ expired, total, used }` |
| `POST /vouchers/generate` | Yes | body: `groupId,userGroupId,profile,count` | `{ count, list }` |
| `DELETE /vouchers/expired` | Yes | query: `groupId`, body: list | `{ code, msg, deletedCount, batchCount }` |
| `GET /clients/auth` | Yes | query: `group_id,page_index,page_size` | `Array<ClientRow>` |
| `GET /clients/unauth` | Yes | query: `group_id,page_index,page_size` | `Array<ClientRow>` |
| `GET /clients/suspected` | Yes | query: `group_id,page_index,page_size` | `Array<ClientRow>` |

## 5) Client Row Field Semantics

For `/clients/*` rows:

- `flowUp`, `flowDown`: formatted strings with suffix `-MB` or `-GB`.
- `duration`: `HH:MM` derived from `activeSec`.
- `/clients/suspected` response does not include `flowUpDown`.

## 6) Deterministic Execution Plan

Use this exact order in app boot/login flow:

1. `POST /login`
  - Alternative: `POST /login/vip` for VIP client credentials.
2. Set bearer from `response.data.data.authorization`
3. `GET /network_group`
4. Choose `groupId`
5. `GET /packages?groupId=...`
6. Optional voucher steps:
   - `GET /vouchers/status?groupId=...`
   - `POST /vouchers/generate`
   - `GET /vouchers`
   - `DELETE /vouchers/expired`
7. Client monitor steps:
   - `GET /clients/auth`
   - `GET /clients/unauth`
   - `GET /clients/suspected`

## 8) Admin VIP Mapping APIs (dashboard/backoffice only)

These endpoints are not for normal end-user app flows, but are used by admin dashboard to manage VIP login mapping.

| Endpoint | Auth | Input | Output in `data` |
|---|---|---|---|
| `POST /admin/login` | No | body: `username`, `password` | `{ username, role, expiresAt }` |
| `GET /admin/api/logins` | Admin cookie | none | session rows + `isVip` |
| `GET /admin/api/vip-credentials` | Admin cookie | none | mapped VIP rows |
| `POST /admin/api/vip-credentials` | Admin cookie | body: `username,password,appid,secret` | `{ ok: true }` |
| `DELETE /admin/api/vip-credentials/{username}` | Admin cookie | path: `username` | `{ ok: true }` |

## 7) Demo Mode

Demo base URL: `http://localhost:3000/demo`

Apply the same envelope parsing rules and the same flow, but use `/demo/*` paths.
