# PrimaTrade API

REST API for the PrimaTrade backend assignment: JWT authentication, role-based access (user / admin), and CRUD for **tasks**. Stack: **Node.js**, **Express 5**, **Prisma**, **PostgreSQL**, **Zod** validation, **Swagger** docs.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

1. **Clone and install**

   ```bash
   cd backend
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set values:

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `JWT_ACCESS_SECRET` | Strong secret (32+ chars) for access tokens |
   | `JWT_REFRESH_SECRET` | Strong secret for refresh tokens |
   | `COOKIE_SECRET` | Secret for signed cookies |
   | `PORT` | Server port (default `4000`) |
   | `CORS_ORIGINS` | **Production:** comma-separated browser origins (e.g. `https://app.vercel.app`) |
   | `NODE_ENV` | Set to `production` when deployed (enables HTTPS-only CORS + cross-site cookies) |

3. **Database**

   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

   Seed creates:

   - Admin: `admin@primetrade.ai` / `Admin@1234`
   - User: `user@primetrade.ai` / `User@1234`

4. **Run**

   ```bash
   npm run dev
   ```

   - API: `http://localhost:4000`
   - Health: `GET /api/health`
   - **Swagger UI**: `http://localhost:4000/api/docs`
   - OpenAPI JSON: `GET http://localhost:4000/api/docs.json`

## API versioning

All business routes are under **`/api/v1`**: `/api/v1/auth`, `/api/v1/tasks`, `/api/v1/admin`.

## Frontend

The React app in `../frontend` expects the API at `http://localhost:4000` (or set `VITE_API_BASE_URL`). Run the backend first, then `npm run dev` in the frontend folder.

## Postman

Import `postman/PrimaTrade.postman_collection.json` and set the `baseUrl` variable (e.g. `http://localhost:4000/api/v1`). Run **Login** first so the collection stores the `accessToken` for protected requests.

## Scalability note

- **Modular monolith**: Features live under `src/modules/*` (auth, tasks, admin) so new domains can be added without reshaping the core app.
- **Stateless API nodes**: JWT access tokens and DB-backed refresh tokens allow horizontal scaling behind a load balancer; sticky sessions are not required for auth.
- **Next steps for scale**: Move refresh-token storage to **Redis** with TTL for faster revocation and clustering; add **read replicas** or connection pooling for PostgreSQL; extract high-traffic areas (e.g. notifications) into **async workers** or separate services when boundaries are clear; optionally front the API with a **CDN** or **API gateway** for rate limits and TLS termination.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm start` | Production build and run |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Seed demo data |
