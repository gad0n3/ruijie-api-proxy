# Ruijie API Proxy

A robust Node.js + Express API proxy designed to interface seamlessly with Ruijie Cloud upstream services. This project implements a **Clean Architecture** to ensure high stability, consistent data formatting, and ease of maintenance.

## Project Structure

- `routes/` - Express route definitions organized by domain.
- `modules/` - Business logic partitioned into clean modules (Auth, Voucher, Package, Client, NetworkGroup).
  - `controllers/` - HTTP request handlers.
  - `useCases/` - Core business logic and validation.
  - `gateways/` - Upstream API integration.
  - `repositories/` - Persistence adapters (Firebase).
- `compositionRoot.js` - Centralized dependency injection wiring.
- `infrastructure/` - Shared persistence logic and external service adapters.
- `middleware/` - Standardized Express middleware (Auth, Error Handling, Logging).
- `helpers/` - Reusable utilities for data formatting, token parsing, and general logic.
- `docs/` - OpenAPI/Swagger specifications and detailed integration guides.
- `firebase/` - Firebase Admin initialization and configuration.

## Architectural Principles

Following a comprehensive refactoring, the project adheres to several key design patterns:
- **Dependency Injection**: Modules receive their dependencies (gateways, repositories) via constructors, enabling high testability.
- **Consistent Error Handling**: Semantic custom error classes and a global error middleware ensure predictable failure responses.
- **Standardized Input Validation**: Schema-based validation for all incoming requests.
- **Centralized Configuration**: Environment variables are validated and managed through a single source of truth (`config.js`).
- **Structured Logging**: Unified logging abstraction for improved observability.

## Prerequisites

- Node.js 20+ (Optimized for modern LTS)
- npm or yarn
- Firebase Project (for session and credential storage)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in the required values:
   - `UPSTREAM_BASE_URL`: The target Ruijie Cloud API URL.
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`: Firebase service account details.
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`: Credentials for the proxy admin dashboard.

3. **Start the server**:
   ```bash
   # Development mode with nodemon
   npm run dev

   # Production mode
   npm start
   ```

## Available Scripts

- `npm start`: Runs the server in production mode.
- `npm run dev`: Runs the server in development mode with auto-reload.
- `npm test`: Executes the Jest test suite.
- `bash scripts/smoke.sh`: Performs a lightweight health check.
- `bash scripts/e2e.sh`: Runs end-to-end integration tests.

## API Response Envelope

All API routes return a normalized JSON envelope:

### Success
```json
{
  "success": true,
  "message": "OK",
  "data": { ... },
  "meta": { "count": 10 }
}
```

### Error
```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": {
    "httpStatus": 400,
    "name": "ValidationError",
    "details": { ... }
  }
}
```

## Authentication

1.  Call `POST /login` with `appid` and `secret`.
2.  Extract the `authorization` string from `response.data.authorization`.
3.  Include this token in the `Authorization` header for all subsequent requests:
    `Authorization: Bearer <appid>::<access_token>`

## Core Endpoints

### Authentication
- `POST /login`: Standard application login.
- `POST /login/vip`: Login via VIP credential mapping.
- `GET /auth/core/projects`: List projects associated with the session.

### Network Discovery
- `GET /network_group`: List leaf network groups.

### Packages & Vouchers
- `GET /packages`: List user groups (packages) for a specific group.
- `POST /vouchers/generate`: Generate new voucher codes.
- `GET /vouchers/active|remain|expired`: Grouped voucher listings.
- `DELETE /vouchers/expired`: Batch delete expired vouchers.

### Client Monitoring
- `GET /clients`: List authenticated devices currently connected to a group.

## Documentation

For detailed integration steps, data schemas, and AI agent flow guidance, please refer to:
- **Client Integration Guide**: `docs/client-docs.md`
- **OpenAPI/Swagger Spec**: `docs/openapi.yaml` (available at `http://localhost:3000/docs` when running).

## Admin Dashboard

Manage VIP credential mappings and monitor active proxy sessions:
- **URL**: `http://localhost:3000/admin`
