# Tasks 13 + 14 — How to test

## 0. Start everything

```bash
# Terminal 1 — MongoDB must already be running (mongod, or an Atlas URI in backend/.env)
# Terminal 2 — backend
cd backend && npm install && npm run seed && npm start
#   expect:  MongoDB connected successfully
#            Server running on port 5000
# Terminal 3 — mock API (demo data)
cd mock-api && npm install && npm start            # http://localhost:5001
# Terminal 4 — React
cd react-frontend && npm install && npm run dev    # http://localhost:5173
```

`backend/.env` must have `CLIENT_URL=http://localhost:5173` (the port Vite prints). If Vite picks another port, put
that port in `CLIENT_URL` and restart the backend, otherwise the browser gets a CORS 403.

## 1. Quick automatic check (no browser)

```bash
cd backend
npm run smoke            # 55 passed, 0 failed
npm run test:socket      # 41 passed, 0 failed   (Task 13)
npm run test:security    # 51 passed, 0 failed   (Task 14)  -> then restart the backend (see below)
```

`test:security` ends by firing failed logins until it gets **429**. The counter is in the server's memory:
press `Ctrl+C` in the backend terminal and run `npm start` again before using the app or re-running the test.

## 2. Task 13 in the browser (Activity 13.11)

Use two separate browser profiles (or one normal + one private window): `sessionStorage` is per tab, so tabs of
the same browser also work, but two profiles is the cleanest.

| # | Do this | Expect |
|---|---------|--------|
| 1 | Window 1: Register **Student A** (password **12+ characters**, department required) -> lands on Dashboard | Dashboard opens |
| 2 | Window 2: Register **Student B** the same way | Dashboard opens |
| 3 | Both: sidebar **💬 Chat** | "Connection: **Online**" in green, and "Your user ID: ..." shown |
| 4 | Window 1: click **Copy** next to A's ID, and in Window 2 do the same for B. Paste each ID into the *other* window's recipient box | |
| 5 | Window 1 (A): type a message, **Send** | A's own message appears on the right ("You") |
| 6 | Window 2 (B) — do not touch anything | The message appears **without refreshing**, the recipient box fills itself with A's ID, a toast "New message from Student A" appears, and the sidebar 🔔 badge goes up |
| 7 | Window 2: sidebar **🔔 Notifications** | Top block lists "New message from Student A" with **Mark as Read**; click it -> button disappears, badge drops |
| 8 | Stop the backend (`Ctrl+C`) | Both windows change to **Offline** and Send is disabled. Start it again and reload -> Online |
| 9 | Refresh Window 1, open Chat, paste B's ID, click **Load Chat History** | The earlier messages come back from MongoDB |
| 10 | In the browser console run `sessionStorage.removeItem("token")` and reload the Chat page, or visit Chat while logged out | Chat shows Offline / "Authentication required"; the server never accepts the socket |

Check MongoDB: `mongosh` -> `use faceprep_course_system` -> `db.messages.find()` and `db.notifications.find()`.

## 3. Task 14 manual checks (Postman / Thunder Client, base `http://localhost:5000/api/v1`)

| Test | Request | Expect |
|------|---------|--------|
| Invalid registration email | `POST /auth/register` `{"name":"A","email":"nope","password":"LearnSecure123","department":"CSE"}` | 400, `errors[0].field = "email"` |
| Missing required fields | `POST /auth/register` `{}` | 400 |
| Short password (11 chars) | same with `"password":"Elevenchars"` | 400 "at least 12 characters" |
| Duplicate email | register the same valid user twice | 201 then 409 |
| Incorrect login password | `POST /auth/login` wrong password | 401 |
| Missing JWT | `GET /profile` without header | 401 |
| Expired JWT | `GET /profile` with a token past its `JWT_EXPIRES_IN` (e.g. set `JWT_EXPIRES_IN=5s`, log in, wait) | 401 |
| Student on admin endpoint | `POST /courses` with a student token | 403 |
| Invalid MongoDB ID | `GET /courses/abc` | 400 |
| Unknown route | `GET /nothing` | 404 `API endpoint not found` |
| Unexpected error | (covered by `npm run test:security`) | `{"message":"Internal server error"}` with status 500, no details leaked |
| Too many logins | 11 wrong-password logins in a row | 429 `Too many login attempts. Try again later.` |
| Password in MongoDB | `db.users.findOne({email:"..."})` | `passwordHash` starts with `$2a$12$` / `$2b$12$` |
| Pagination | `GET /courses?limit=2&page=2`, `GET /courses?limit=5000` | 200 with 2 courses and `X-Total-Count`; 400 |
| CORS | `curl -H "Origin: http://evil.example" localhost:5000/api/v1/courses -i` | 403 |
| Helmet | `curl -i localhost:5000/api/v1/courses` | `X-Content-Type-Options: nosniff`, no `X-Powered-By` |
| Another student's profile | `PUT /profile` only ever edits the token's own user; `PUT /profile/<otherId>` | own profile only; 404 |
| Another user's messages | Student C calls `GET /messages/<A's id>` | `{"messages":[]}` — only C's own conversation with A |

## 4. Graceful shutdown (Activity 14.10)

Press `Ctrl+C` in the backend terminal. Expect:

```
Shutting down (SIGINT)...
HTTP server and MongoDB connection closed.
```

Starting a second copy while one is running prints `Port 5000 is already in use...` and exits cleanly.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Browser console: `Origin not allowed by CORS` / 403 | `CLIENT_URL` in `backend/.env` must equal the exact URL in the address bar (scheme + host + port); restart the backend |
| Chat says "Authentication required" | You are not logged in through the API (log in again); token lives in `sessionStorage` so a new tab/window needs its own login |
| Chat says "Invalid authentication token" | Token expired (1 hour) or `JWT_SECRET` changed: log in again |
| Everything returns 429 on login | Rate limit tripped: restart the backend |
| `Unable to start server` | MongoDB isn't running / `MONGO_URI` is wrong |
| Registration says "Password must contain at least 12 characters" | New Task 14 rule |
