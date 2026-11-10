# Task 15 — Deployment guide (Vercel + Render + MongoDB Atlas)

**What gets deployed (3 hosted pieces + 1 database):**

| Piece | Host | Folder in your repo |
|-------|------|---------------------|
| React website | Vercel | `react-frontend` |
| Express API + Socket.IO (chat) | Render (Web Service #1) | `backend` |
| json-server demo API (enrollments, activities, admin records) | Render (Web Service #2) | `mock-api` |
| Database | MongoDB Atlas | — |

> Your project still keeps enrollments, activities and admin student records in the json-server demo API
> (see "Known limitations" at the bottom), so it must be deployed too, or those pages will not load.

Do the parts **in this order**. You need free accounts on GitHub, MongoDB Atlas, Render and Vercel.
Everything below was prepared and tested locally in production mode; the live deployment itself can only be
done by you, in your own accounts.

---

## Part 1 — Check locally first (5 minutes)

```bash
cd backend
npm ci
npm start                  # must print: MongoDB connected successfully / Server running on port 5000
```
In another terminal:
```bash
cd react-frontend
npm ci
npm run build              # must finish with "built in ..." and create the dist folder
```
Open http://localhost:5000/api/health — you should see `{"status":"ok","message":"API is running"}`.

## Part 2 — Push to GitHub

Run from the **project root** (the folder that contains `backend`, `react-frontend`, `mock-api`).

First time only:
```bash
git init
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git   # create the empty repo on github.com first
```
Then:
```bash
git status
git add .
git commit -m "Prepare Faceprep full stack project for deployment"
git push -u origin main
```

**Safety check before pushing** — this must print nothing for `.env` and nothing for `node_modules`:
```bash
git ls-files | grep -E "(^|/)\.env$|node_modules"
```
(`.env.example` files are fine and expected.) If a real secret was ever committed, rotate it: `.gitignore`
does not remove it from Git history.

## Part 3 — MongoDB Atlas

1. Sign in at https://cloud.mongodb.com -> **Create a project** -> **Build a Database** -> choose **M0 (Free)**.
2. **Database Access** -> **Add New Database User**
   - Authentication: Password. Use a strong password (let Atlas generate one, avoid `@ : / ? # %` if possible).
   - Privileges: **Specific Privileges** -> role **readWrite** on database **faceprep_course_system**
     (least privilege: this user cannot touch other databases or administer the cluster).
3. **Network Access** -> **Add IP Address**
   - Render's free plan has no single fixed IP. In Render open your backend service -> **Connect** ->
     **Outbound** to see its outbound IP ranges, and add those. This is the narrowest option.
   - Also add **your own IP** (button: *Add Current IP Address*) so you can run the seed command in Part 4.
   - If you cannot use the Render ranges, `0.0.0.0/0` (anywhere) works for a coursework project **only** with a
     strong database password. It is the broadest setting, so replace it with the narrow list when you can.
4. **Database** -> **Connect** -> **Drivers** -> copy the connection string:
   ```
   mongodb+srv://USER:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>` with the real password and add the database name before the `?`:
   ```
   mongodb+srv://USER:YOURPASSWORD@cluster0.xxxxx.mongodb.net/faceprep_course_system?retryWrites=true&w=majority
   ```
   If the password contains special characters, URL-encode them (`@` -> `%40`, `#` -> `%23`, ...).
5. Keep this string private. It goes only into Render's environment variables (and your own terminal for Part 4),
   never into React code or GitHub.

## Part 4 — Put the courses and your admin account into Atlas

Run these **on your own computer**, in the `backend` folder, using the Atlas string for just these commands
(your IP must be allowed in Atlas Network Access).

PowerShell (Windows):
```powershell
cd backend
$env:MONGO_URI="PASTE-YOUR-ATLAS-STRING"
$env:ADMIN_EMAIL="you@example.com"
$env:ADMIN_PASSWORD="choose-a-long-password-123"
$env:NODE_ENV="production"
npm run seed          # adds the 6 starter courses (and the admin, because ADMIN_PASSWORD is set)
```
macOS / Linux:
```bash
cd backend
MONGO_URI='PASTE-YOUR-ATLAS-STRING' ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='choose-a-long-password-123' NODE_ENV=production npm run seed
```
To create only an admin (no courses) use `npm run create-admin` with the same variables. It uses the same
User model and the same bcrypt hashing as normal registration, so the admin logs in on the normal login page.
The demo password `admin123` is never used in production. Close the terminal afterwards (or `Remove-Item Env:MONGO_URI`).

## Part 5 — Deploy the Express backend on Render

1. https://dashboard.render.com -> **New +** -> **Web Service** -> connect your GitHub repo.
2. Settings:

   | Field | Value |
   |-------|-------|
   | Name | e.g. `lms-portal-api` |
   | Root Directory | `backend` |
   | Runtime | Node |
   | Build Command | `npm ci` |
   | Start Command | `npm start` |
   | Instance type | Free |
   | Health Check Path (Advanced) | `/api/health` |

3. **Environment Variables** (do not set `PORT`: Render provides it):

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas string |
   | `JWT_SECRET` | a random value of **32+ characters**. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `JWT_EXPIRES_IN` | `1h` |
   | `CLIENT_URL` | your Vercel URL (you do not have it yet: put `http://localhost:5173` for now, fix in Part 8) |

4. **Create Web Service** and wait for **Live**. Your URL looks like `https://lms-portal-api.onrender.com`.
5. Open `https://YOUR-BACKEND.onrender.com/api/health` -> `{"status":"ok","message":"API is running"}`.
   Open `https://YOUR-BACKEND.onrender.com/api/health/db` -> `{"status":"ok","database":"connected"}`
   (this one also proves MongoDB Atlas works).

> **Free plan note:** Render puts free services to sleep after ~15 minutes without traffic; the next request
> takes about 30-60 seconds to wake it. The first login/chat after a pause can be slow, and sleeping drops the socket
> connection (the chat reconnects automatically once the service is awake).

## Part 6 — Deploy the mock API on Render

Same as Part 5, but:

| Field | Value |
|-------|-------|
| Name | e.g. `lms-portal-mock-api` |
| Root Directory | `mock-api` |
| Build / Start | `npm ci` / `npm start` |
| Health Check Path | `/health` |
| Env `NODE_ENV` | `production` |
| Env `CLIENT_URL` | Vercel URL (placeholder for now, fix in Part 8) |

Check `https://YOUR-MOCK-API.onrender.com/health` and `https://YOUR-MOCK-API.onrender.com/courses`.

(Optional shortcut: **New + -> Blueprint** with the `render.yaml` in the project root creates both services and
asks you for `MONGO_URI` and `CLIENT_URL`.)

## Part 7 — Deploy React on Vercel

1. https://vercel.com -> **Add New -> Project** -> import the GitHub repo.
2. Settings:

   | Field | Value |
   |-------|-------|
   | Root Directory | `react-frontend` |
   | Framework Preset | **Vite** |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

3. **Environment Variables** (use your real Render URLs, **no trailing slash**):

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://YOUR-BACKEND.onrender.com/api/v1` |
   | `VITE_SOCKET_URL` | `https://YOUR-BACKEND.onrender.com` |
   | `VITE_MOCK_API_URL` | `https://YOUR-MOCK-API.onrender.com` |

4. **Deploy**. Your URL looks like `https://your-project.vercel.app`.
5. `react-frontend/vercel.json` is already included, so refreshing `/dashboard` serves the app instead of a 404.

Vite bakes these values into the build: **if you change them later, redeploy** (Deployments -> ... -> Redeploy).

## Part 8 — Production CORS (connect the pieces)

Set `CLIENT_URL` to your **exact Vercel URL** (copy it from the browser bar; `https://`, no trailing slash) on
**both** Render services:

- Render -> backend service -> **Environment** -> `CLIENT_URL=https://your-project.vercel.app` -> **Save**
- Render -> mock-api service -> same.

Saving restarts/redeploys the service. Several allowed sites can be listed separated by commas.
Express CORS **and** Socket.IO both read this one variable.

## Part 9 — Test production (Activity 15.10)

Use the **Vercel URL** in the browser. Tick each box only after you have really done it.

| Done | Feature | How to test |
|------|---------|-------------|
| [ ] | Registration | Register a new student (12+ character password) |
| [ ] | Login | Log in; DevTools -> Application -> Session Storage shows a `token` |
| [ ] | Authentication | `curl -i https://YOUR-BACKEND.onrender.com/api/v1/profile` -> **401** |
| [ ] | Student CRUD | Log in as the admin -> Admin Dashboard: add, edit, delete a test student |
| [ ] | Course CRUD | Admin -> Manage courses: create, edit, delete a test course |
| [ ] | Database persistence | Render -> backend service -> **Restart service** (top-right menu); log in again; your user and courses are still there (Atlas -> Browse Collections shows them) |
| [ ] | Enrollment | Student enrolls in a course |
| [ ] | Learning progress | Student updates progress |
| [ ] | Dashboard | Summary numbers load |
| [ ] | Chat | Two browser profiles, two students: exchange messages (see `docs/task13-14-testing.md` section 2) |
| [ ] | Notifications | The recipient sees the toast / badge / notification **without refreshing** |
| [ ] | Responsive design | Browser DevTools device toolbar: desktop, tablet (~768px), mobile (~375px) |
| [ ] | API errors | Register with a bad email -> message shown; `curl https://YOUR-BACKEND.onrender.com/api/v1/courses/abc` -> 400; unknown path -> 404 |
| [ ] | Logout | Log out; the `token` is gone from Session Storage and `/dashboard` redirects to login |
| [ ] | Refresh on `/dashboard` | Press F5: the page loads (no 404) |

> The mock API (enrollments, activities, admin student records) forgets changes whenever its Render service
> restarts or redeploys. That is expected on the free plan; MongoDB data (users, courses, messages,
> notifications) persists.

Optional: run the automatic checks against production. They **create test users in the production database**
and the security test needs your local `.env` to point at the same database, so prefer the manual table above.
The socket test and the health checks are safe to point at production:
```bash
cd backend
API_URL=https://YOUR-BACKEND.onrender.com npm run test:socket
```
(`test:socket` signs a few fake tokens with the `JWT_SECRET` from your local `.env`. If it differs from the production one,
the single check "Valid token for a deleted/unknown user" fails: that is expected, everything else is unaffected.)

## Part 10 — If something goes wrong (Activity 15.11)

Logs: Render -> your service -> **Logs**. Vercel -> **Deployments -> (latest) -> Build Logs**. Browser -> **F12 -> Console / Network**.

| Symptom | What to check |
|---------|---------------|
| Render log: `MongoDB connection failed ... Authentication failed` | Atlas user/password in `MONGO_URI`; URL-encode special characters; database user has `readWrite` |
| Render log: `MongoDB connection failed ... timed out` / `ENOTFOUND` | Atlas **Network Access** does not include Render's IPs; host name typo in `MONGO_URI` |
| Render log: `JWT_SECRET must be set ... 32 characters` | Set `JWT_SECRET` (32+ chars) and save |
| Render deploy fails: `npm ci` error | `package-lock.json` must be committed in `backend`; or change Build Command to `npm install` |
| Browser: `blocked by CORS policy` / API answers 403 | `CLIENT_URL` on Render must equal the Vercel address exactly (https, no trailing slash); save and wait for the redeploy; remember preview URLs differ from the production URL |
| Requests go to the wrong place / 404 on `/courses` | `VITE_API_URL` must end with `/api/v1`; redeploy Vercel after changing it; check Network tab for the real URL called |
| Browser console: `VITE_API_URL is not set` | Variable missing in Vercel -> add -> **Redeploy** |
| Everyone gets "Too many login attempts" | Make sure `NODE_ENV=production` on Render (it enables the proxy setting so users are counted separately) |
| Login says invalid token / session expired | `JWT_EXPIRES_IN` is `1h`; log in again. If `JWT_SECRET` was changed, everyone must log in again |
| Chat shows Offline / `websocket error` | `VITE_SOCKET_URL` = backend origin **without** `/api/v1`; `CLIENT_URL` correct; service may be waking up (wait 60 s); you must be logged in |
| Refresh on `/dashboard` gives 404 | `vercel.json` is missing from the `react-frontend` folder in GitHub |
| Blank white page | Vercel build log; browser Console; Root Directory must be `react-frontend`, output `dist` |
| Enrollment / admin pages empty or erroring | `VITE_MOCK_API_URL` wrong, mock-api service asleep (open its `/health`), or its `CLIENT_URL` wrong |
| Backend won't start on Render | Render Logs; Start Command `npm start`; Root Directory `backend`; Node 18+ |

## Known limitations (read before sharing the link)

These come from how Tasks 9–12 built the project, and they matter more once the app is public:

1. **The json-server mock API is public and unauthenticated.** Anyone who knows its URL can read and change its
   data. It also stores the *legacy* (mock) admin/student passwords in plain text in `db.json`, and the
   "register as admin" option on the Register page creates such a legacy admin. Use it for demo data only; never real
   people's data or a password you use elsewhere. The secure accounts are the ones in MongoDB (bcrypt + JWT).
   The proper fix is moving enrollments, activities and student records into Express + MongoDB
   (the Enrollment / LearningProgress models already exist) — a good follow-up task.
2. **Mock API data is not durable** on Render's free plan (resets on restart/redeploy).
3. **Chat has no recipient authorization**: any logged-in user can message any user ID. Rate limits are in place (20 messages /
   10 s per user; 10 failed logins per 15 min per IP); decide who may talk to whom before opening
   the app to the public.
4. **Student deletion cleanup**: deleting a student from the admin page removes the mock-API record only; the
   MongoDB account, its messages and notifications are untouched. Add cleanup/anonymization before real use.
5. **Enrollment history** (withdrawn status) is not implemented because enrollments are still in the mock API.
6. The rate-limit counter and socket message limits live in server memory: use a shared store (e.g. Redis) if you
   ever run more than one backend instance.
7. A JWT lasts 1 hour and is kept in `sessionStorage`; an open chat keeps working until the page reconnects.
