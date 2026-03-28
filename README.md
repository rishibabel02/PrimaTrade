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

## API documentation

- **Swagger UI** (when the backend is running): `/api/docs`
- **Postman**: import [backend/postman/PrimaTrade.postman_collection.json](./backend/postman/PrimaTrade.postman_collection.json)

## Scalability

See the **Scalability note** section in [backend/README.md](./backend/README.md).
