# Task 12 — How to test (Activity 12.7)

Base URL for Postman: `http://localhost:5000/api/v1`. Send `Content-Type: application/json` for bodies.
Protected requests need the header `Authorization: Bearer <token>`.

## Setup

1. Start MongoDB.
2. `cd backend && npm install && npm run seed && npm start` — you must see `MongoDB connected successfully` and `Server running on port 5000`.
3. Optional shortcut: with the server running, `npm run smoke` runs every API check below automatically.

## Steps

| # | Do this | Expect |
|---|---------|--------|
| 1 | `POST /auth/register` `{"name":"Arun Kumar","email":"arun@example.com","password":"LearnSecure123","department":"CSE"}` | 201. In `mongosh`: `use faceprep_course_system` then `db.users.find({email:"arun@example.com"})` shows the document with a hashed `passwordHash` |
| 2 | Stop the backend (Ctrl+C), start it again, then `POST /auth/login` with the same email/password | 200 + `token` (the student survived the restart) |
| 3 | `GET /profile` with the token | 200, `user` with name, email, role, department |
| 4 | `PUT /profile` `{"name":"Arun K"}`, then `GET /profile` again | name is `Arun K` both times; `db.users.find(...)` shows it too |
| 5 | `POST /auth/login` as `admin@example.com` / `admin123`, then `POST /courses` `{"title":"Cloud Basics","category":"Technology","icon":"☁️"}` with the **admin** token | 201 with `course.id` (24 hex characters). Same request with the student token gives 403 |
| 6 | `GET /courses/<id>`, `PUT /courses/<id>` (change the title), `DELETE /courses/<id>`, then `GET /courses/<id>` | 200, 200, 200, then 404 |
| 7a | `GET /courses/abc` | 400 `Validation failed` (with `errors: [{field: "id", message: "Invalid identifier"}]`) |
| 7b | Register the same email twice | 409 |
| 7c | `POST /courses` as admin with `{}` | 400 (required fields) |
| 7d | `PUT /profile` `{"name":""}` | 400 |
| 7e | `GET /courses/64b7f0f0f0f0f0f0f0f0f0f0` | 404 |

## React (http://localhost:5173)

Run all three servers (backend, mock-api, frontend).

1. Register a student on the Register page, then check `db.users` in MongoDB.
2. Dashboard -> Settings: change the full name and save. Refresh the page: the new name is still there (loaded from MongoDB via `/auth/me`).
3. Log out, log in as `admin@example.com` / `admin123` -> Admin Dashboard -> **Manage courses (MongoDB)**. Add, edit and delete a course; each change shows in the table and in `db.courses.find()`.
4. Log in as a student: **My Courses** lists the catalog from MongoDB, and the sidebar has no "Manage Courses" item.
