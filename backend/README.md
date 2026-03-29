# PrimaTrade Backend

Express 5 · TypeScript · Prisma · PostgreSQL · Swagger

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | ≥32 char secret for access tokens (15 min TTL) |
| `JWT_REFRESH_SECRET` | ✅ | ≥32 char secret for refresh tokens (7 day TTL) |
| `COOKIE_SECRET` | ✅ | Cookie signing secret |
| `PORT` | — | Default `4000` |
| `NODE_ENV` | — | `development` / `production` |
| `CORS_ORIGINS` | prod | Comma-separated frontend origins, e.g. `https://app.vercel.app` |

Copy `.env.example` → `.env` and fill in.

## API reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Create account |
| `POST` | `/api/v1/auth/login` | None | Login → access token + refresh cookie |
| `POST` | `/api/v1/auth/refresh` | None | Rotate tokens |
| `POST` | `/api/v1/auth/logout` | None | Invalidate refresh token |
| `POST` | `/api/v1/auth/logout-all` | 🔑 | Revoke all refresh tokens |
| `GET` | `/api/v1/auth/me` | 🔑 | Current user profile |
| `GET` | `/api/v1/tasks` | 🔑 | List tasks (paginated, filterable) |
| `POST` | `/api/v1/tasks` | 🔑 | Create task |
| `GET` | `/api/v1/tasks/:id` | 🔑 | Get task |
| `PUT` | `/api/v1/tasks/:id` | 🔑 | Update task |
| `DELETE` | `/api/v1/tasks/:id` | 🔑 | Delete task |
| `GET` | `/api/v1/admin/users` | 👑 Admin | List all users |
| `PATCH` | `/api/v1/admin/users/:id/promote` | 👑 Admin | Promote to admin |
| `GET` | `/api/v1/admin/stats` | 👑 Admin | Platform statistics |
| `GET` | `/api/docs` | None | Swagger UI |
| `GET` | `/api/health` | None | Health check |

## Scalability note

### Current architecture

Single Node.js process → PostgreSQL. Appropriate for moderate traffic. Bottlenecks emerge at ~500 RPS sustained.

### Horizontal scaling path

1. **Multiple API instances** behind an Nginx/ALB load balancer
   - Session state is stateless (JWT) → no sticky sessions needed
   - Refresh tokens in DB work across instances

2. **Read replicas** — Prisma supports replica URLs; route `findMany`/`findUnique` reads to a replica

3. **Caching (Redis)**
   - Cache `/api/v1/admin/stats` (TTL 60s) — pure aggregation query
   - Cache user profiles after `/auth/me` (invalidate on update)
   - Use Redis for refresh token storage instead of Postgres (O(1) lookups)

4. **Rate limiting at gateway** — move `express-rate-limit` logic to Nginx or an API gateway (Kong/AWS API GW) so it works across instances

5. **Message queue (BullMQ/RabbitMQ)** — for future features like email notifications or async task processing

6. **Microservices split (if needed)**
   - Auth Service: handles JWT issuance, token refresh
   - Tasks Service: CRUD + RBAC
   - Notification Service: email/push

7. **Docker + Kubernetes**
   - Each service runs in a container
   - Horizontal Pod Autoscaler scales on CPU/RPS
   - `prisma migrate deploy` in init container
