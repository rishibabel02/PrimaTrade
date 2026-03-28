# PrimaTrade

Full-stack demo for the PrimaTrade backend assignment: **JWT auth**, **user vs admin** roles, **task CRUD**, and a **React** UI. API is versioned under `/api/v1` with **Swagger** at `/api/docs`.

## Repository layout

| Folder | Description |
|--------|-------------|
| `backend/` | Express 5 + Prisma + PostgreSQL API ([detailed docs](./backend/README.md)) |
| `frontend/` | Vite + React + TypeScript client |

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ (local or Docker)
- npm (or pnpm/yarn)

## Quick start

### 1. Database

Create a database (example name `primatrade`) and note the connection string.

Example with Docker:

```bash
docker run --name primatrade-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=primatrade -p 5432:5432 -d postgres:16
```

Then use:

`postgresql://postgres:postgres@localhost:5432/primatrade`

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, COOKIE_SECRET

npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

API: **http://localhost:4000**  
Swagger: **http://localhost:4000/api/docs**  
Health: **http://localhost:4000/api/health**

After seeding:

- User: `user@primetrade.ai` / `User@1234`
- Admin: `admin@primetrade.ai` / `Admin@1234`

### 3. Frontend

In a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

App: **http://localhost:5173**

The UI calls `http://localhost:4000/api/v1` by default. To override, add `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

## Production builds

```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm run preview
```

## Deploy frontend on Vercel

This app uses **Vite**, not Create React App. If the build fails with `react-scripts: command not found`, Vercel is using the wrong preset or an old **Build Command** override.

**Option A — project root = repository root (recommended with this repo)**

1. In Vercel: **Settings → General → Root Directory** = `.` (empty / repository root).
2. **Settings → General → Build & Development Settings**: clear **Build Command** and **Output Directory** overrides (let [vercel.json](./vercel.json) at the repo root define them).
3. Redeploy.

**Option B — Root Directory = `frontend`**

1. Set **Root Directory** to `frontend`.
2. **Framework Preset**: **Vite**.
3. Build Command: `npm run build`, Output: `dist`.
4. Remove any custom command that mentions `react-scripts`.

**Environment variables on Vercel**

The browser must call your **deployed API**, not `localhost`. In Vercel → **Settings → Environment Variables**, set:

```text
VITE_API_BASE_URL=https://your-api-host.example.com/api/v1
```

Redeploy after changing env vars (Vite bakes `VITE_*` in at build time). Your API must allow this origin in **CORS** (add your `https://*.vercel.app` URL in the backend `cors` config for production).

The backend is not deployed by this Vercel project; host it separately (Railway, Render, Fly.io, etc.) and point `VITE_API_BASE_URL` at it.

## API documentation

- **Swagger UI** (when the backend is running): `/api/docs`
- **Postman**: import [backend/postman/PrimaTrade.postman_collection.json](./backend/postman/PrimaTrade.postman_collection.json)

## Scalability

See the **Scalability note** section in [backend/README.md](./backend/README.md).
