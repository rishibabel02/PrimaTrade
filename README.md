# PrimaTrade

A full-stack scalable REST API and React frontend application built for the PrimaTrade Backend Developer assignment. It features **JWT authentication with rotation**, **role-based access control (RBAC)**, **task management** with filtering/pagination, and a premium dark-themed React UI.

## Live Demo

- **Frontend (Vercel):** [https://primatrade-rishi-bs-projects.vercel.app](https://primatrade-rishi-bs-projects.vercel.app)
- **API Base URL (Render):** `https://primatrade.onrender.com/api/v1`
- **Swagger Documentation:** [https://primatrade.onrender.com/api/docs](https://primatrade.onrender.com/api/docs)
- **API Health Check:** [https://primatrade.onrender.com/api/health](https://primatrade.onrender.com/api/health)

### Test Credentials
| Role | Email | Password |
|---|---|---|
| **User** | `user@primetrade.ai` | `User@1234` |
| **Admin** | `admin@primetrade.ai` | `Admin@1234` |

*(Note: The Render backend is on a free tier and spins down after 15 minutes of inactivity. The first request may take ~30-50 seconds to wake up the server. A 5-second timeout on the frontend protects against hanging UI).*

---

## 🛠 Tech Stack

### Backend
- **Core:** Node.js, Express 5, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **Security:** bcryptjs (password hashing), jsonwebtoken (auth), Helmet, CORS, Express Rate Limit
- **Validation:** Zod
- **Documentation:** Swagger UI, Postman

### Frontend
- **Core:** React 18, Vite, TypeScript
- **Routing:** React Router v6
- **Data Fetching:** Axios (with custom JWT interceptors and silent refresh queue)
- **Styling:** Custom Vanilla CSS (Premium Dark Theme, CSS Variables, Animations)

---

## 📂 Repository Layout

| Folder | Description |
|--------|-------------|
| `backend/` | Express 5 + Prisma API. Contains all business logic, routes, controllers, and services. |
| `frontend/` | React + Vite client. Contains components, pages, state management, and API clients. |

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js** v18+
- **PostgreSQL** 14+ (Local or via Docker)

Example running PostgreSQL with Docker:
```bash
docker run --name primatrade-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=primatrade -p 5432:5432 -d postgres:16
```

### 2. Backend Setup
In a terminal, navigate to the backend folder:
```bash
cd backend
cp .env.example .env
```

Edit your `.env` file to include your database credentials and randomly generated JWT secrets.

Install dependencies, provision the DB, and run the server:
```bash
npm install
npx prisma db push     # Sync schema
npx prisma generate    # Generate client
npm run db:seed        # Seed demo user & admin accounts
npm run dev            # Start development server
```
The API will run on `http://localhost:4000`.

### 3. Frontend Setup
In a **second** terminal, navigate to the frontend folder:
```bash
cd frontend
npm install
npm run dev
```
The application will run on `http://localhost:5173`. By default, it communicates with `http://localhost:4000/api/v1`.

---

## 📈 Scalability Considerations

The architecture is designed to scale horizontally:
1. **Stateless Authentication:** JWTs are used instead of session stores, meaning backend instances don't need sticky sessions.
2. **Database:** PostgreSQL is configured with proper connection pooling (handled by Prisma).
3. **Optimizations:** Advanced queries run efficiently (e.g., using Prisma `groupBy` to fetch all stats in a single database roundtrip, taking the load off multiple API calls).
4. *(Future)* For extremely high load, Redis can be introduced for refresh-token blacklisting/caching, and PostgreSQL read-replicas could be used for heavy GET requests.

## 📄 API Documentation

- **Swagger UI** (when the backend is running locally): `http://localhost:4000/api/docs`
- **Postman**: Import the collection located at `backend/postman/PrimaTrade.postman_collection.json`.

