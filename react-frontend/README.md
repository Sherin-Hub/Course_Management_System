# LMS Portal — React + Local Mock API

This project keeps the existing LMS Portal UI and adds a simple local REST Mock API.

## Project structure

```text
lms-portal/
├── mock-api/
│   ├── db.json
│   └── package.json
└── react-frontend/
    ├── src/
    │   ├── services/
    │   │   └── api.js
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── lib/
    │   │   └── storage.js
    │   ├── components/
    │   │   ├── AdminRoute.jsx
    │   │   └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── AdminDashboard.jsx
    │       └── dashboard/
    └── public/style.css
```

## What changed

- Student registration now creates a student in the Mock API.
- Login checks the Mock API instead of browser-stored account data.
- Student profile/password updates use the API.
- Courses, enrollments, progress, activity, and notifications use the API.
- Admin login is supported.
- Added `/admin` for student management.
- Admin can view, add, edit, and delete students.
- Loading, empty, API-error, invalid-login, and failed-request states are handled.
- `localStorage` is only used for the current session email; application data lives in `mock-api/db.json`.

## Start the Mock API

Open terminal 1:

```bash
cd mock-api
npm install
npm start
```

The API runs at:

```text
http://localhost:5000
```

Example endpoints:

```text
GET    http://localhost:5000/students
POST   http://localhost:5000/students
PATCH  http://localhost:5000/students/:id
DELETE http://localhost:5000/students/:id

GET    http://localhost:5000/admins
GET    http://localhost:5000/courses
GET    http://localhost:5000/enrollments
GET    http://localhost:5000/activities
GET    http://localhost:5000/notifications
```

## Start the frontend

Open terminal 2:

```bash
cd react-frontend
npm install
npm run dev
```

Open the Vite URL, normally:

```text
http://localhost:5173
```

## Test Admin Login

Use the seeded account:

```text
Email: admin@example.com
Password: admin123
```

After login, the app opens `/admin`.

### Test admin CRUD

1. Open Admin Dashboard.
2. Click Add student and enter student details.
3. Submit.
4. The new student appears in the table.
5. Click Edit and change the details.
6. Click Delete to remove the record.
7. Refresh the table; the data comes again from the Mock API.

## Test Student Login

Seeded student:

```text
Email: student@example.com
Password: student123
```

You can also register a new student from `/register`.

### Test student registration

1. Open Register.
2. Keep Student selected.
3. Enter name, phone, email and password.
4. Submit.
5. The student is created in `mock-api/db.json`.
6. The app signs the student in and opens the student dashboard.

### Test course persistence

1. Login as the demo student.
2. Open My Courses.
3. Click Continue learning.
4. Progress is updated through the API.
5. Open the API's `enrollments` data to see the changed progress.
6. Enroll in another course; a new enrollment is created.

## Password reset

The existing demo reset flow is preserved.

```text
OTP: 123456
```

The final password update is sent to the Mock API.

## Notes

This is a development-only Mock API. Passwords are intentionally stored as plain text in `db.json` because this is a local learning/demo backend, not a production authentication system.

The original UI, routes, dashboard pages, styles, course cards, certificates, notifications, and settings were kept. The changes are focused on replacing application-data localStorage operations with REST API calls and adding the missing admin CRUD screen.
