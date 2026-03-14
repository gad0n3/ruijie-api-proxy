# Ruijie Uplink API Reference

This document details the upstream (uplink) Ruijie API endpoints used by the proxy. Each section includes the HTTP method, endpoint, required parameters, authentication, and real request/response examples.

**Base URL:** `https://cloud-as.ruijienetworks.com/service/api`

---

## Authentication

### Obtain Access Token
- **Method:** POST
- **Endpoint:** `/oauth20/client/access_token?token=<RUIJIE_LOGIN_TOKEN>`
- **Headers:**
  - `appid`: Ruijie application id
  - `secret`: Ruijie application secret
- **Description:** Obtain an access token for further API calls.

---

## Tenant Info

### Get Tenant Info
- **Method:** GET
- **Endpoint:** `/org/tenant/info?access_token=<token>`
- **Description:** Retrieve tenant information for the authenticated app.

**Example Request:**
```bash
curl -s "https://cloud-as.ruijienetworks.com/service/api/org/tenant/info?access_token=<ACCESS_TOKEN>"
```

**Example Response:**
```json
{
    "code": 0,
    "msg": "OK.",
    "tenantName": "nika.nus.sg@gmail.com",
    "aliasName": "nika.nus.sg@gmail.com",
    "tenantId": 614797,
    "logo": "1924de5716204f86834c7e4d8ad2ad76.png"
}
```

---

## Network Groups

### Get Network Groups
- **Method:** GET
- **Endpoint:** `/group/single/tree?access_token=<token>`
- **Description:** Get all network groups (tree structure).

**Example Request:**
```bash
curl -s "https://cloud-as.ruijienetworks.com/service/api/group/single/tree?access_token=<ACCESS_TOKEN>"
```

**Example Response:**
```json
{
    "code": 0,
    "msg": "OK.",
    "groups": {
        "name": "dumy",
        "timezone": "Asia/Shanghai",
        "groupId": 0,
        "subGroups": [
            {
                "name": "nika.nus.sg",
                "description": "nika.nus.sgroot group",
                "timezone": "Asia/Rangoon",
                "groupId": 8563586,
                "createTime": "Feb 25, 2026, 4:17:25 PM",
                "type": "ROOT",
                "businessType": "MARKET",
                "subGroups": [
                    {
                        "name": "SUEWIN",
                        "description": "",
                        "timezone": "Asia/Rangoon",
                        "groupId": 7682332,
                        "createTime": "Aug 19, 2025, 2:07:41 PM",
                        "type": "BUILDING",
                        "businessType": "UNCERTAIN",
                        "subGroups": [],
                        "lvl": 2,
                        "sceneEnum": "UNCERTAIN"
                    }
                ],
                "lvl": 1,
                "sceneEnum": "COMMON"
            }
        ]
    },
    "rootGroupName": "dumy",
    "rootGroupId": 0
}
```

---

## Packages (Usergroups)

### List Packages
- **Method:** GET
- **Endpoint:** `/intl/usergroup/list/{groupId}`
- **Query Params:**
  - `access_token`: Access token
  - `pageIndex`: Page index (default 1)
  - `pageSize`: Page size (default 10)
  - `lang`: Language (default 'en')
- **Description:** List usergroups (packages) for a group.

**Example Request:**
```bash
curl -s "https://cloud-as.ruijienetworks.com/service/api/intl/usergroup/list/7682332?access_token=<ACCESS_TOKEN>&pageIndex=1&pageSize=10&lang=en"
```

**Example Response:**
```json
{
    "code": 0,
    "msg": "OK.",
    "data": [
        {
            "id": 511370,
            "userGroupName": "1D @ 10MBPS",
            "authProfileId": "33823184226299113976475400805322",
            "createTime": 1773325920000,
            "updateTime": 1773325920000,
            "name": "1D @ 10MBPS",
            "noOfDevice": 1,
            "bindMac": 1,
            "timePeriod": 1440,
            "quota": 0.0,
            "downloadRateLimit": 10240,
            "uploadRateLimit": 10240,
            "price": 1000.0,
            "packageType": "COMMON",
            "isBindSsid": 0,
            "kickOffType": 1,
            "limitedTimes": 0,
            "durationCtrlType": 0,
            "timePeriodDaily": 60
        },
        {
            "id": 400824,
            "userGroupName": "3000MMK",
            "authProfileId": "57676522295176137364219820215935",
            "createTime": 1760966157000,
            "updateTime": 1769438369000,
            "name": "3000MMK",
            "noOfDevice": 1,
            "bindMac": 1,
            "timePeriod": 1440,
            "quota": 0.0,
            "downloadRateLimit": 5120,
            "uploadRateLimit": 5120,
            "price": 3000.0,
            "packageType": "COMMON",
            "isBindSsid": 0,
            "kickOffType": 1,
            "limitedTimes": 0,
            "durationCtrlType": 0,
            "timePeriodDaily": 60
        }
    ],
    "count": 5,
    "maxAllowNum": 20
}
```

### Create Package
- **Method:** POST
- **Endpoint:** `/intlSamProfile/create/{tenant}/{tenant}/{groupId}` then `/intl/usergroup/group/{groupId}`
- **Description:** Two-step: Create an auth profile, then a usergroup.

### Update Package
- **Method:** POST, PUT
- **Endpoint:** `/intlSamProfile/update/{tenant}/{tenant}/{groupId}` then `/intl/usergroup/group/{groupId}`
- **Description:** Two-step: Update an auth profile, then update the usergroup.

### Delete Package
- **Method:** DELETE
- **Endpoint:** `/intl/usergroup/group/{groupId}` then `/intlSamProfile/delete/{authProfileId}`
- **Description:** Two-step: Delete a usergroup, then delete the associated auth profile.

---

## Vouchers

### Voucher Status
- **Method:** GET
- **Endpoint:** `/intlSamVoucher/getStatus/{tenantName}/{groupId}`
- **Query Params:**
  - `access_token`: Access token
  - `lang`: Language (default 'en')
- **Description:** Get voucher status summary (expired, total, used counts).

**Example Request:**
```bash
curl -s "https://cloud-as.ruijienetworks.com/service/api/intlSamVoucher/getStatus/nika.nus.sg%40gmail.com/7682332?access_token=<ACCESS_TOKEN>&lang=en"
```

**Example Response:**
```json
{
    "code": 0,
    "msg": "OK.",
    "voucherData": {
        "code": 0,
        "msg": "OK.",
        "expired": 10,
        "total": 243,
        "used": 2
    }
}
```

### List Vouchers
- **Method:** GET
- **Endpoint:** `/intlSamVoucher/getList/{tenantName}/{groupId}`
- **Query Params:**
  - `access_token`: Access token
  - `start`: Start index (default 0)
  - `pageSize`: Page size (default 100)
  - `status`: Voucher status (`1`: Unused, `2`: Inuse, `3`: Expired)
  - `name`: Voucher name filter
  - `userMac`: User MAC address filter
  - `createBegin`: Creation start date
  - `createEnd`: Creation end date
  - `lang`: Language (default 'en')
- **Description:** List vouchers for a group with optional filters.

**Example Request:**
```bash
curl -s "https://cloud-as.ruijienetworks.com/service/api/intlSamVoucher/getList/nika.nus.sg%40gmail.com/7682332?access_token=<ACCESS_TOKEN>&start=0&pageSize=3&status=1&lang=en"
```

**Example Response:**
```json
{
    "code": 0,
    "msg": "OK.",
    "voucherData": {
        "code": 0,
        "msg": "OK.",
        "count": 231,
        "list": [
            {
                "uuid": "506d9f5bee26444aa745d5c1ce77945a",
                "tenantId": "gWcbSMtHpCpThrZdDvTFTCnKoXHOqVJU",
                "voucherCode": "782rc4ads",
                "nameRef": "",
                "timePeriod": 1440,
                "usedTime": 0,
                "createTime": 1773459274000,
                "maxClients": 1,
                "currentClients": 0,
                "quota": 0.0,
                "usedQuota": 0.0,
                "status": "1",
                "downloadRateLimit": 10240,
                "uploadRateLimit": 10240,
                "packagePrice": 1000.0,
                "bindMac": 1,
                "packageName": "1D @ 10MBPS",
                "userGroupId": "511370",
                "userGroupName": "1D @ 10MBPS",
                "firstName": "",
                "lastName": "",
                "email": "",
                "phone": "",
                "comment": "",
                "disableStatus": 0
            }
        ]
    }
}
```

### Generate Vouchers
- **Method:** POST
- **Endpoint:** `/intlSamVoucher/create/{tenant}/{tenant}/{groupId}`
- **Description:** Generate new vouchers.

### Delete Expired Vouchers
- **Method:** DELETE
- **Endpoint:** `/intlSamVoucher/v2/delete`
- **Description:** Delete expired vouchers in batch.

---

## Clients

### Get Current Users
- **Method:** GET
- **Endpoint:** `/open/v1/dev/user/current-user`
- **Query Params:**
  - `access_token`: Access token
  - `group_id`: Network group id
  - `page_index`: Page index (default 1)
  - `page_size`: Page size (default 100)
- **Description:** Get current connected users (wireless and wired).

**Example Request:**
```bash
curl -G "https://cloud-as.ruijienetworks.com/service/api/open/v1/dev/user/current-user" \
     --data-urlencode "access_token=<ACCESS_TOKEN>" \
     --data-urlencode "group_id=7682332" \
     --data-urlencode "page_index=1" \
     --data-urlencode "page_size=10"
```

**Example Response:**
```json
{
    "code": 0,
    "msg": "OK.",
    "list": [
        {
            "mac": "2cd0.6677.28e9",
            "ip": "172.0.100.48",
            "onlineTime": 1773457525000,
            "userName": "M2003J15SC-636333004",
            "flowUp": 0,
            "flowDown": 0,
            "flowUpDown": 0,
            "upRate": 0,
            "downRate": 0,
            "activeSec": 2412,
            "updateTime": 1773459939000,
            "connectType": "wireless",
            "clientSource": "EG",
            "manufacturerId": "REDMI",
            "manufacturer": "Redmi",
            "staCategory": "mobileDevices",
            "staLabel": "PHONE",
            "staLabelName": "Smartphone",
            "staOs": "Android 10",
            "staModel": "10X",
            "isMlo": 0,
            "authMac": false
        },
        {
            "mac": "9c6b.7240.f039",
            "ip": "172.0.100.47",
            "onlineTime": 1773456017000,
            "userName": "",
            "linkedDevice": "H1TC0EK004765",
            "linkedPort": "LAN0",
            "deviceName": "Ruijie",
            "groupName": "SUEWIN",
            "flowUp": 0,
            "flowDown": 0,
            "flowUpDown": 0,
            "upRate": 19997,
            "downRate": 33252,
            "activeSec": 3920,
            "updateTime": 1773459939000,
            "connectType": "wire",
            "clientSource": "EG",
            "staCategory": "aiDevices",
            "staLabel": "AIDEVICE",
            "staLabelName": "Smart Gadgets",
            "staOs": "Android",
            "isMlo": 0,
            "authMac": false
        }
    ],
    "totalCount": 8
}
```

---

## Notes
- All endpoints require a valid access token unless otherwise noted.
- Replace placeholders (e.g., `<ACCESS_TOKEN>`, `{groupId}`) with actual values.
- `tenantName` must be URL-encoded (e.g., `@` → `%40`).
- Ruijie MAC format uses dots (e.g., `2cd0.6677.28e9`), not colons.
- Timestamps are in milliseconds since epoch.
- Speed values (`downloadRateLimit`, `uploadRateLimit`) are in **Kbps**.
- `timePeriod` is in **minutes**.