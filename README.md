# LMS Portal — React + Express (Tasks 9 & 10)

```text
lms-portal/
├── backend/          NEW  Express API (CommonJS) on http://localhost:5000
├── mock-api/         json-server (enrollments, activities, notifications, admin) — now on port 5001
└── react-frontend/   React + Vite + Axios on http://localhost:5173
```

## Run it (three terminals)

```bash
# 1. Express backend (auth + courses)
cd backend && npm install && npm start        # http://localhost:5000

# 2. Mock API (enrollments, notifications, admin data)
cd mock-api && npm install && npm start       # http://localhost:5001

# 3. React frontend
cd react-frontend && npm install && npm run dev   # http://localhost:5173
```

`backend/.env` already contains a freshly generated `JWT_SECRET`. It is git-ignored; generate your own
with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` before sharing/submitting.

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

- Students are stored **in memory** in the backend: restarting it clears accounts (as the task notes).
  Register again after a restart.
- The registration form now has a **Department** field (the API requires it). Phone is optional on the API.
- The admin account (`admin@example.com` / `admin123`) and the Admin Dashboard still use the mock API, as before;
  admins do not get a JWT.
- Profile editing, password change and "forgot password" still operate on the mock API, so they are
  not available for students registered through the new API (Settings shows a message).
- Any logged-in student can create/update/delete courses (authentication only, no admin role yet).
