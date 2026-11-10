# LMS Portal — React + Express + MongoDB + Socket.IO (Tasks 9–15)

```text
lms-portal/
├── backend/          Express API + Socket.IO (CommonJS) on http://localhost:5000, data in MongoDB
├── docs/             database-schema.md (Task 11), task12-testing.md, task13-14-testing.md, deployment-guide.md (Task 15)
├── render.yaml       optional Render blueprint (backend + mock API)
├── mock-api/         json-server (enrollments, activities, notifications, demo admin data) — port 5001
└── react-frontend/   React + Vite + Axios on http://localhost:5173
```

## Run it

```bash
# 0. MongoDB must be running (local `mongod`, or put your Atlas string in backend/.env as MONGO_URI)

# 1. Express backend (auth + profile + courses) — first time only: seed the catalog and the admin account
cd backend && npm install
npm run seed                                  # 6 courses + admin@example.com / admin123 (safe to re-run)
npm start                                     # http://localhost:5000  (exits if MongoDB is unreachable)

# 2. Mock API (enrollments, notifications, demo data)
cd mock-api && npm install && npm start       # http://localhost:5001

# 3. React frontend
cd react-frontend && npm install && npm run dev   # http://localhost:5173
```

`backend/.env` contains `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, etc. (git-ignored; see `.env.example`). Generate your own secret with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` before sharing/submitting.

## Task 13 — Real-time chat and notifications (Socket.IO)

| Piece | File |
|-------|------|
| Socket.IO server (JWT-authenticated, private room per user) | `backend/config/socket.js` |
| Attached to the one HTTP server that also runs Express | `backend/server.js` (`http.createServer(app)` + `server.listen`) |
| Chat history API `GET /api/v1/messages/:userId` | `backend/routes/messageRoutes.js` |
| Notification API `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read` | `backend/routes/notificationRoutes.js` |
| Socket client (`createSocket()`) | `react-frontend/src/api/socketClient.js` |
| Chat UI (connection status, send, history) | `react-frontend/src/components/Chat.jsx` -> **Dashboard -> Chat** |
| Live notifications UI | `react-frontend/src/components/Notifications.jsx` -> **Dashboard -> Notifications** |

- The socket handshake sends the JWT (`auth.token`). Missing, invalid, expired or unknown-user tokens are rejected.
- The **sender is always taken from the verified token**, never from the client.
- A message is saved in MongoDB, pushed to both users' rooms (`receive_message`), and creates a notification
  for the recipient (`new_notification`, also stored, so it survives a refresh).
- The sidebar **Notifications** badge updates live and a toast pops up on any dashboard page.
- Extras beyond the task sheet: 20 messages / 10 s per user, no messages to yourself, 16 KB packet cap,
  incoming messages only appear in the open conversation, your own user ID is shown (with a Copy button) for testing.
- Chat needs a JWT, so it works for accounts created through the API (students and the seeded admin);
  legacy mock-API-only admin accounts have no token.
- Not built (the task sheet says to add before production): recipient permission rules (any logged-in user can
  message any user ID), a user-picker instead of pasting IDs, shared rate-limit store for multiple servers.

## Task 14 — Optimization, security and error handling

| Activity | What was done |
|----------|---------------|
| 14.1 CORS | `server.js`: only origins listed in `CLIENT_URL` (comma-separated); disallowed origin -> 403. Socket.IO uses the same list (`config/index.js`). |
| 14.2 Validation | `express-validator` rules in `backend/validators/` (auth, courses, profile, ObjectId params, pagination, messages, notifications) + `middleware/validateRequest.js` -> `400 {message:"Validation failed", errors:[{field,message}]}`. Password minimum is now **12** characters (frontend updated to match). Mongoose schemas still validate too. |
| 14.3 Password hashing | `authService.js` uses `bcrypt.hash(password, 12)` / `bcrypt.compare`; the model has no save hook (so no double hashing). |
| 14.4 Error handling | Order in `server.js`: helmet/CORS/morgan/JSON -> routes -> 404 `{message:"API endpoint not found"}` -> `errorHandler`. |
| 14.5 Helmet | `app.use(helmet())` before the routes. |
| 14.6 Rate limit | `middleware/loginLimiter.js` on `POST /auth/login`: 10 failed attempts / 15 min per IP -> 429 (`LOGIN_RATE_LIMIT` to change). In-memory counter: restart the backend to reset it. |
| 14.7 Queries | `.lean()` on course reads; pagination `GET /courses?page=1&limit=20` (limit capped at 100, totals in `X-Total-Count` / `X-Page` / `X-Limit` / `X-Total-Pages` headers; body stays an array). The email index already comes from `unique: true`, so no duplicate index was added. |
| 14.8 Logging | `morgan("combined")` (no bodies, passwords or tokens are logged). |
| 14.9 Secrets | `.gitignore` ignores `.env` / `.env.*` (keeps `.env.example`); `.env.example` has placeholders only. |
| 14.10 Process safety | `unhandledRejection` / `uncaughtException` are logged then shut down gracefully; `SIGINT` / `SIGTERM` close Socket.IO, the HTTP server and MongoDB (10 s safety timer); clear message when the port is already in use. |
| 14.11 Tests | `npm run test:security` (below) and `docs/task13-14-testing.md`. |

Notes: course lists keep creation order (`_id` ascending) because the demo enrollments rely on it; a Gmail address
is only lower-cased (dots are not stripped), so registering and logging in always agree.
The seeded admin password `admin123` is for local demos only: change it (`ADMIN_PASSWORD` before `npm run seed`)
before deploying. Use a process manager (pm2, systemd, Docker, your host) to restart the app if it exits.

## Automated checks (server running, MongoDB seeded)

```bash
cd backend
npm run smoke            # 55 checks: Tasks 9-12 behaviour still works
npm run test:socket      # 41 checks: socket auth, delivery, notifications, history, privacy, rate limit
npm run test:security    # 51 checks: the Task 14.11 table; ends by triggering 429 -> then RESTART the backend
# SKIP_RATE_LIMIT_TEST=1 npm run test:security   skips the 429 part
```

## Deployment

### Live Application

> Fill these in **after** you deploy (steps: `docs/deployment-guide.md`).

- Frontend: https://your-frontend.vercel.app
- Backend: https://your-backend.onrender.com
- API Health: https://your-backend.onrender.com/api/health
- Demo (mock) API: https://your-mock-api.onrender.com

### Technology Stack

- React, React Router, Axios
- Node.js and Express
- MongoDB and Mongoose
- JWT and bcryptjs
- Socket.IO
- json-server (demo data: enrollments, activities, admin student records)

### Features

- Student registration and login
- JWT authentication
- Admin and student role-based access
- Student and Course CRUD
- Course enrollment and unenrollment
- Learning progress tracking
- Real-time chat and notifications
- Responsive frontend

### Local Setup

1. Clone the GitHub repository.
2. In `backend`, install dependencies using `npm install`.
3. Create `backend/.env` from `backend/.env.example`.
4. Configure `MONGO_URI`, `JWT_SECRET` and `CLIENT_URL`.
5. Run `npm run seed`, then start the backend using `npm start`.
6. In `mock-api` and in `react-frontend`, run `npm install`.
7. Create `react-frontend/.env` from `react-frontend/.env.example` (API, Socket.IO and mock API URLs).
8. Start the mock API with `npm start` (in `mock-api`) and the frontend using `npm run dev` (in `react-frontend`).

### Deployment

The frontend is hosted on Vercel, the backend (and the demo mock API) on Render, and the production database on
MongoDB Atlas. Environment variables:

| Where | Variable | Value |
|-------|----------|-------|
| Render (backend) | `NODE_ENV` | `production` |
| Render (backend) | `MONGO_URI` | Atlas connection string (secret) |
| Render (backend) | `JWT_SECRET` | random, 32+ characters (secret) |
| Render (backend) | `JWT_EXPIRES_IN` | `1h` |
| Render (backend and mock API) | `CLIENT_URL` | deployed Vercel URL, no trailing slash |
| Vercel | `VITE_API_URL` | `https://your-backend.onrender.com/api/v1` |
| Vercel | `VITE_SOCKET_URL` | `https://your-backend.onrender.com` |
| Vercel | `VITE_MOCK_API_URL` | `https://your-mock-api.onrender.com` |

Full walkthrough, production test checklist and troubleshooting table: **`docs/deployment-guide.md`**.

### Testing

- Local automated checks (this repository): `npm run smoke`, `npm run test:socket`, `npm run test:security` in `backend`
  (see "Automated checks" above); production-mode behaviour (health endpoints, CORS, proxy-aware rate limiting,
  admin creation) was also exercised locally.
- Manual browser tests for registration, login, role access, CRUD, enrollment, progress, chat, notifications and
  responsive layout are listed in `docs/task13-14-testing.md` and `docs/deployment-guide.md`.
- Production test results: _not recorded yet._ Complete the checklist in `docs/deployment-guide.md` (Part 9) against
  your live URLs and only then update this line.

## Task 12 — Database integration & CRUD

Students and courses are now stored in MongoDB (no more in-memory arrays).

| Method | Endpoint                  | Access                         |
|--------|---------------------------|--------------------------------|
| POST   | /api/v1/auth/register     | Public (always creates a `student`) |
| POST   | /api/v1/auth/login        | Public (returns JWT)           |
| GET    | /api/v1/auth/me           | JWT                            |
| GET    | /api/v1/profile           | JWT (own profile)              |
| PUT    | /api/v1/profile           | JWT (own `name`, optional `phone`) |
| GET    | /api/v1/courses, /:id     | Public                         |
| POST   | /api/v1/courses           | JWT + **admin**                |
| PUT    | /api/v1/courses/:id       | JWT + **admin**                |
| DELETE | /api/v1/courses/:id       | JWT + **admin**                |

- `server.js` connects to MongoDB first, then starts Express; if the connection fails it prints the reason and exits.
- `middleware/errorHandler.js` (last middleware) maps duplicate keys -> 409, validation errors -> 400, bad ids -> 400.
- Course ids are MongoDB ObjectIds; malformed ids return 400 before touching the database.
- Admin rights are checked against the database on every course write (`requireAdmin`), not just the token.
- There is deliberately **no** `DELETE /profile`: deleting a student must also clean up enrollments, progress, notifications
  and messages, which is not built yet.
- Automated check (server running, DB seeded): `cd backend && npm run smoke`.
- Full manual test list for Postman and React: `docs/task12-testing.md`.

## Task 9 — Registration, login, course APIs

| Method | Endpoint                  | Access                |
|--------|---------------------------|-----------------------|
| POST   | /api/v1/auth/register     | Public                |
| POST   | /api/v1/auth/login        | Public (returns JWT)  |
| GET    | /api/v1/auth/me           | JWT (extra: restores session on refresh) |
| GET    | /api/v1/courses           | Public                |
| GET    | /api/v1/courses/:id       | Public                |
| POST   | /api/v1/courses           | JWT required          |
| PUT    | /api/v1/courses/:id       | JWT required          |
| DELETE | /api/v1/courses/:id       | JWT required          |

Passwords are hashed with bcryptjs (12 rounds) and never returned. Duplicate email -> 409, wrong
password -> 401 "Invalid email or password".

## Task 10 — JWT

- `authController.login` signs a JWT (`sub` = student id, `email`, expiry from `JWT_EXPIRES_IN`).
- `middleware/authMiddleware.js` (`authenticateToken`) verifies `Authorization: Bearer <token>`.
- `routes/courseRoutes.js` protects POST/PUT/DELETE; GETs stay public.
- `react-frontend/src/api/apiClient.js` adds the token from `sessionStorage` through an Axios interceptor.
- The token is stored on login and removed on logout (`AuthContext.jsx`).

## Testing

Postman/Thunder Client: follow Tests A–E in the task sheet (URLs use `http://localhost:5000/api/v1`).
Automated check with the server running: `cd backend && node smoke-test.js`.
In the app: register -> dashboard -> **Manage Courses** (create / edit / delete use the JWT).
To see the 401 path, run in the browser console `sessionStorage.removeItem("token")` and try to create a course.

## Things to know

- Student accounts and courses persist in MongoDB, so restarting the backend no longer clears them.
- Enrollments, activity feed and notifications still live in the json-server mock API (their MongoDB versions are
  modelled in `backend/models/` but not wired to routes yet). New students get demo enrollments on the first
  catalog courses.
- The admin account is created by `npm run seed`. Admins registered through the Register page's admin option still
  go to the mock API and have no JWT, so they cannot change courses; use the seeded admin.
- The Admin Dashboard's student table still reads the mock API, not MongoDB.
- Password change and "forgot password" still operate on the mock API, so they are not available for MongoDB accounts.
- Chat messages and the live notifications (Tasks 13) are stored in MongoDB; the older demo notifications on the
  Notifications page still come from the mock API and are listed under "Course updates".
