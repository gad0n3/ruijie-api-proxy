# Ruijie API Proxy - Client Integration Guide

This document provides a comprehensive reference for integrating with the Ruijie API Proxy. It is designed for frontend developers and AI agents implementing client-side logic.

## Overview

The Ruijie API Proxy acts as a middle layer between client applications and the Ruijie Cloud upstream services. It provides:
- **Standardized Response Envelopes**: Consistent JSON structure for all responses.
- **Simplified Authentication**: Token-based access with session persistence in Firebase.
- **Enhanced Data Formatting**: Human-readable speeds, durations, and MAC addresses.
- **Clean Architecture**: Decoupled modules and semantic error handling.

---

## 1. Authentication Flow

### 1.1 Initial Login

| Endpoint | Method | Payload | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `POST` | `{ "appid": "...", "secret": "..." }` | Standard login. Alias: `/auth/core/login` |
| `/login/vip` | `POST` | `{ "username": "...", "password": "..." }` | VIP mapping login. Alias: `/auth/core/vip-login` |

### 1.2 Login Response

```json
{
  "success": true,
  "data": {
    "appid": "opena305a89b2d79",
    "secret": "63899898099e42c3b5bfef8d9325e008",
    "authorization": "Bearer opena305a89b2d79::RFH8oE1I0n1p2n5of6d3k5p8n4U8oC3j",
    "access_code": null
  }
}
```

### 1.3 Using the Token

Send the `authorization` value in the `Authorization` header for all protected requests:
```
Authorization: Bearer <appid>::<access_token>
```

---

## 2. Response Standard (The Envelope)

Every API response follows a consistent envelope format.

### 2.1 Success Envelope

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```
- `data`: Contains the actual business payload.
- `meta`: Optional pagination or summary data.

### 2.2 Error Envelope

```json
{
  "success": false,
  "message": "Human readable message",
  "error": {
    "httpStatus": 400,
    "name": "ValidationError",
    "details": {},
    "code": "OPTIONAL_ERROR_CODE",
    "nextAction": "suggested_client_fix"
  }
}
```

---

## 3. Quick Endpoint Map

### Auth
- `POST /login`
- `POST /login/vip`
- `POST /auth/core/login` (alias)
- `POST /auth/core/vip-login` (alias)

### Network Group
- `GET /network_group`

### Packages
- `GET /packages?groupId=`
- `POST /packages/create`
- `POST /packages/:groupId`
- `DELETE /packages/:uuid?groupId=&packageId=&authProfileId=`

### Vouchers
- `GET /vouchers/remain?groupId=&start=&pageSize=`
- `GET /vouchers/active?groupId=&start=&pageSize=`
- `GET /vouchers/expired?groupId=&start=&pageSize=`
- `GET /vouchers/status?groupId=`
- `GET /vouchers/performance?groupId=`
- `POST /vouchers/generate`
- `DELETE /vouchers/expired?groupId=`

### Clients
- `GET /clients?group_id=&page_index=&page_size=`

---

## 4. Canonical Request/Response Contracts

All examples below show the payload inside `response.data`.

---

### 4.1 Login

`POST /login`

**Request:**
```json
{ "appid": "opena305a89b2d79", "secret": "63899898099e42c3b5bfef8d9325e008" }
```

**Response `data`:**
```json
{
  "appid": "opena305a89b2d79",
  "secret": "63899898099e42c3b5bfef8d9325e008",
  "authorization": "Bearer opena305a89b2d79::RFH8oE1I0n1p2n5of6d3k5p8n4U8oC3j",
  "access_code": null
}
```

### 4.1.1 VIP Login

`POST /login/vip`

**Request:**
```json
{ "username": "vip_user_1", "password": "vip_password_1" }
```

**Response:** Same as login.

---

### 4.2 Network Group

`GET /network_group`

**Response `data`:**
```json
[
  { "name": "SUEWIN", "groupId": 7682332 }
]
```

---

### 4.3 Packages

`GET /packages?groupId=7682332`

**Response `data`:**
```json
[
  {
    "id": 511370,
    "name": "1D @ 10MBPS",
    "userGroupName": "1D @ 10MBPS",
    "authProfileId": "33823184226299113976475400805322",
    "price": 1000,
    "price_label": "1000ကျပ်",
    "speed": 10240,
    "timePeriod": 1440,
    "noOfDevice": 1
  }
]
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `price` | number | Raw price value |
| `price_label` | string | Price with currency suffix (e.g., "1000ကျပ်") |
| `speed` | number | Download rate limit in Kbps |
| `timePeriod` | number | Duration in minutes |

### 4.3.1 Create Package

`POST /packages/create`

**Request:**
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
  "groupId": 7682332,
  "name": "2h",
  "isBindSsid": 0
}
```

### 4.3.2 Update Package

`POST /packages/:groupId`

### 4.3.3 Delete Package

`DELETE /packages/:uuid?groupId=7682332&packageId=504694&authProfileId=55395712657796200634438859765701`

---

### 4.4 Voucher Lists (Grouped by Date)

All three voucher list endpoints return the same consistent shape.

| Endpoint | Status | Group Key |
| :--- | :--- | :--- |
| `GET /vouchers/remain` | Unused (1) | `create_date` |
| `GET /vouchers/active` | In-Use (2) | `login_date` |
| `GET /vouchers/expired` | Expired (3) | `expiry_date` |

**Query Params:** `groupId` (required), `start`, `pageSize`

**Response `data`:**
```json
[
  {
    "date": "3/14/2026",
    "time_type": "create_date",
    "vouchers": [
      {
        "voucher_code": "782rc4ads",
        "time_period": 1440,
        "max_clients": 1,
        "status": "1",
        "package_price": 1000,
        "price_label": "1000ကျပ်",
        "bind_mac": 1,
        "package_name": "1D @ 10MBPS",
        "user_group_id": "511370",
        "disable_status": 0,
        "speed": "10Mbps",
        "duration": "1 day",
        "create_time": "3/14/2026 10:04 AM",
        "expiry_time": "",
        "login_time": ""
      }
    ]
  }
]
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `date` | string | Group date (M/D/YYYY) |
| `time_type` | string | `create_date`, `login_date`, or `expiry_date` |
| `voucher_code` | string | Unique voucher code |
| `speed` | string | Download speed (e.g., "10Mbps") |
| `price_label` | string | Price with currency suffix |
| `duration` | string | Human-readable (e.g., "1 day", "4 hours") |
| `create_time` | string | Short date/time (e.g., "3/14/2026 10:04 AM") |
| `expiry_time` | string | Short date/time or empty |
| `login_time` | string | Short date/time or empty |

---

### 4.5 Voucher Status

`GET /vouchers/status?groupId=7682332`

**Response `data`:**
```json
{
  "expired": 10,
  "total": 243,
  "used": 2
}
```

---

### 4.6 Voucher Performance

`GET /vouchers/performance?groupId=7682332`

- **`lastDay`**: In-use vouchers activated within the last 24 hours.
- **`monthly`**: Expired vouchers that expired within the last 30 days.

**Response `data`:**
```json
{
  "lastDay": {
    "count": 2,
    "price": 2000,
    "packages": [
      { "name": "1000mmk", "count": 2 }
    ]
  },
  "monthly": {
    "count": 10,
    "price": 10000,
    "packages": [
      { "name": "1D @ 10MBPS", "count": 2 },
      { "name": "1000mmk", "count": 8 }
    ]
  }
}
```

---

### 4.7 Generate Vouchers

`POST /vouchers/generate`

**Request:**
```json
{
  "groupId": 7682332,
  "userGroupId": 511370,
  "profile": "33823184226299113976475400805322",
  "count": 3
}
```

**Response `data`:**
```json
{
  "count": 3,
  "list": [
    {
      "uuid": "6236ee6623554c8caccefeb7bdddd741",
      "voucherCode": "wtia35r5v",
      "status": "1",
      "profileId": "33823184226299113976475400805322",
      "expiryTime": "2125-03-05 08:23:22"
    }
  ]
}
```

---

### 4.8 Delete Expired Vouchers (Auto-fetch)

`DELETE /vouchers/expired?groupId=7682332`

No request body required. Server automatically fetches and deletes all expired vouchers.

**Response `data`:**
```json
{
  "code": 0,
  "msg": "Success.",
  "deletedCount": 2,
  "batchCount": 1
}
```

---

### 4.9 Clients

`GET /clients?group_id=7682332&page_index=1&page_size=100`

**Response `data`:**
```json
[
  {
    "mac": "D8:B0:53:AE:13:4A",
    "staModel": "Redmi Note 11",
    "ip": "172.0.100.33",
    "duration": "02:15"
  }
]
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `mac` | string | Uppercase MAC with colons (e.g., `D8:B0:53:AE:13:4A`) |
| `staModel` | string | Device manufacturer + model |
| `ip` | string | Client IP address |
| `duration` | string | Connection duration in `HH:MM` format |

---

## 5. Error Handling

### 5.1 Usergroup Not Synchronized (Code 1014)

When the upstream responds with `voucherData.code = 1014`, the proxy returns a **409 Conflict**.

```json
{
  "success": false,
  "message": "Selected usergroup is not synchronized yet.",
  "error": {
    "httpStatus": 409,
    "code": "USERGROUP_NOT_SYNCED",
    "resetRequired": true,
    "nextAction": "refresh_network_group_and_reselect"
  }
}
```

**Client reset flow:**
1. Clear selected `groupId` and package state.
2. Reload groups via `GET /network_group`.
3. Recheck with `GET /vouchers/status?groupId=...`.
4. Proceed only when status call succeeds.

---

## 6. AI Agent Handoff (Deterministic Flow)

Follow this strict execution order:

1. `POST /login` → Capture `data.authorization`.
2. `GET /network_group` → Select a `groupId`.
3. `GET /packages?groupId=...` → Select `id` and `authProfileId`.
4. `POST /vouchers/generate` using selected package IDs.
5. `GET /vouchers/remain?groupId=...` to display new vouchers.

### Response parsing rules
1. Every response is an envelope: `{ success, message, data, meta }`.
2. Business payload is always in `response.data`.
3. Error envelope: `{ success: false, message, error: { httpStatus, details } }`.

---

## 7. Admin Dashboard

- **URL**: `http://localhost:3000/admin`
- Login with admin credentials (configured in `.env`).
- Manage VIP credential mappings.
- View active Firebase proxy sessions.

---

## 8. Demo Mode

For testing without an upstream connection:

- **Base URL**: `http://localhost:3000/demo`
- Mimics all endpoints using local state. No authentication required.
- **Endpoints**: `/demo/login`, `/demo/network_group`, `/demo/vouchers/remain`, etc.