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
Clients must authenticate using either standard Ruijie app credentials or a VIP username mapping.

| Endpoint | Method | Payload | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `POST` | `{ "appid": "...", "secret": "..." }` | Standard login. Alias: `/auth/core/login` |
| `/login/vip` | `POST` | `{ "username": "...", "password": "..." }` | VIP mapping login. Alias: `/auth/core/vip-login` |

### 1.2 Using the Token
Upon success, the API returns an `authorization` string inside the `data` block.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "authorization": "Bearer 12345::abcde12345token",
    "appid": "12345",
    "tenantName": "ExampleCorp"
  }
}
```

**Client Requirement:**
Send this exact string in the `Authorization` header for all protected requests.
`Authorization: Bearer <appid>::<access_token>`

---

## 2. Response Standard (The Envelope)

Every API request (except `/docs` and raw HTML) returns a consistent envelope.

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
  "message": "Meaningful error description",
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

## 3. API Reference

### 3.1 Network Groups

| Endpoint | Method | Response |
| :--- | :--- | :--- |
| `/network_group` | `GET` | `[{ "name": "SUEWIN", "groupId": 7682332 }]` |

---

### 3.2 Packages

| Endpoint | Method | Query/Params | Description |
| :--- | :--- | :--- | :--- |
| `/packages` | `GET` | `groupId` | List all packages for a group. |
| `/packages/create` | `POST` | (Body) | Create Auth Profile + User Group. |
| `/packages/:groupId` | `POST` | (Body) | Update package group settings. |
| `/packages/:uuid` | `DELETE` | `groupId`, `packageId` | Delete the package and its auth profile. |

**Package Data Shape:**
```json
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
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `price` | number | Raw price value |
| `price_label` | string | Price with currency suffix |
| `speed` | number | Download rate limit in Kbps |
| `timePeriod` | number | Duration in minutes |

---

### 3.3 Vouchers

Voucher listings are automatically **grouped by date** and sorted descending.

| Endpoint | Method | Query Params | Status |
| :--- | :--- | :--- | :--- |
| `/vouchers/remain` | `GET` | `groupId`, `start`, `pageSize` | Unused (Status 1) |
| `/vouchers/active` | `GET` | `groupId`, `start`, `pageSize` | In-Use (Status 2) |
| `/vouchers/expired` | `GET` | `groupId`, `start`, `pageSize` | Expired (Status 3) |

**Voucher List Response Shape (all three endpoints are consistent):**
```json
{
  "data": [
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
}
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `date` | string | Group date key (MM/DD/YYYY) |
| `time_type` | string | `create_date`, `login_date`, or `expiry_date` |
| `speed` | string | Download speed (e.g., "10Mbps") |
| `price_label` | string | Price with currency suffix |
| `duration` | string | Human-readable (e.g., "1 day", "4 hours") |
| `create_time` | string | Short date/time (e.g., "3/14/2026 10:04 AM") |
| `expiry_time` | string | Short date/time or empty |
| `login_time` | string | Short date/time or empty |

**Other Voucher Actions:**
- `GET /vouchers/status?groupId=...`: Returns `{ expired, total, used }`.
- `GET /vouchers/performance?groupId=...`: Returns summary with package breakdowns.
  ```json
  {
    "success": true,
    "data": {
      "lastDay": {
        "count": 2,
        "price": 2000,
        "packages": [{ "name": "1000mmk", "count": 2 }]
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
  }
  ```
- `POST /vouchers/generate`: Create new vouchers. Payload requires `groupId`, `userGroupId`, `profile`, and `count`.
- `DELETE /vouchers/expired?groupId=...`: Batch deletes all expired vouchers for the group.

---

### 3.4 Clients
Monitor connected devices.

| Endpoint | Method | Query Params |
| :--- | :--- | :--- |
| `/clients` | `GET` | `group_id`, `page_index`, `page_size` |

**Client Data Shape:**
```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "staModel": "Redmi Note 11",
  "ip": "172.0.100.33",
  "duration": "02:15"
}
```

---

## 4. Specific Error Handling: Usergroup Not Synced

If the upstream API returns code `1014`, the proxy maps this to a **409 Conflict**.

**Client Logic required:**
- If `error.code === "USERGROUP_NOT_SYNCED"`:
  1. Notify the user that the group selection is invalid.
  2. Clear the local state for `selectedGroupId` and `selectedPackage`.
  3. Force a refresh of the `/network_group` list.

---

## 5. AI Agent Handoff (Deterministic Flow)

If you are an AI agent, follow this strict execution order to perform a business operation:

1. **Auth**: `POST /login` -> Capture `data.authorization`.
2. **Select Group**: `GET /network_group` -> User/Agent selects a `groupId`.
3. **Select Package**: `GET /packages?groupId=...` -> Select `id` and `authProfileId`.
4. **Generate**: `POST /vouchers/generate` using selected package IDs.
5. **Display**: `GET /vouchers/remain?groupId=...` to show new vouchers.

---

## 6. Admin Dashboard

The built-in admin panel allows managing VIP mappings and viewing active sessions.

- **URL**: `http://localhost:3000/admin`
- **Functionality**:
  - Login with admin credentials (configured in `.env`).
  - Add/Update VIP mappings (Mapping a simple username/password to a Ruijie AppID/Secret).
  - List all active Firebase proxy sessions.

---

## 7. Demo Mode

For testing without an upstream connection, use the `/demo` prefix.

- **Base URL**: `http://localhost:3000/demo`
- **Behavior**: Mimics all endpoints listed above using local state. No authentication headers are required for demo routes.
- **Endpoints**: `/demo/login`, `/demo/network_group`, `/demo/vouchers/remain`, etc.