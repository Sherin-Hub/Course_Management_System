# LMS Portal — Learning Management System (Frontend)

A fully responsive, client-side Learning Management System portal with account
registration, authentication, password recovery, and an interactive student
dashboard — built with plain HTML, CSS, and JavaScript (no frameworks, no
build step).

---

## 1. Problem Statement

Small training providers, bootcamps, and independent instructors often need a
clean, professional-looking student portal but can't justify the cost or
complexity of a full LMS platform (Moodle, Canvas, etc.) just to prototype an
idea, run a demo, or serve a small cohort. Existing solutions are either too
heavyweight to stand up quickly or too generic to feel like a real product.

**LMS Portal** solves this by providing a complete, self-contained front-end
experience — landing page, registration, login, password recovery, and a
student dashboard — that runs entirely in the browser with zero backend
dependency. It's designed to be either used as-is for a demo/prototype, or
used as the front-end layer that a real backend (Node/Express, Django,
Laravel, etc.) can be dropped in behind later.

## 2. Features

- **Marketing home page** — hero section, platform stats, feature grid, and
  a call-to-action, written to explain the product rather than just show
  placeholder content.
- **Account registration** with role selection (Student / Admin), live field
  validation, and a real-time password strength meter.
- **Login** with "remember me," show/hide password, and a link into password
  recovery.
- **Forgot / reset password flow** — email lookup → 6-digit OTP entry
  (auto-advancing input boxes) → new password with strength meter — all
  gated so a person can't land on the reset screen without going through the
  request step.
- **Student dashboard** — dynamic greeting, avatar initials, enrollment
  stats, a course list with SVG progress rings, and a recent-activity feed,
  all generated from the logged-in account.
- **Dynamic navigation** — the top nav swaps between "Register / Login" and
  "Dashboard" depending on whether someone is signed in, and the dashboard
  route redirects to login if there's no active session.
- **Client-side validation** on every form: required fields, email format,
  10-digit phone numbers, password length/strength, and confirm-password
  matching, with inline error messages and accessible focus states.
- **Toast notifications** for success/error feedback instead of blocking
  `alert()` calls.
- **Fully responsive** — usable from a 360px phone up through desktop, with
  a collapsing dashboard sidebar and stacking auth panels on small screens.

## 3. Tech Stack

| Layer          | Choice                                              |
|----------------|------------------------------------------------------|
| Markup         | Semantic HTML5 (6 pages)                            |
| Styling        | Hand-written CSS3 (custom properties / design tokens, Grid & Flexbox, no framework) |
| Typography     | [Fraunces](https://fonts.google.com/specimen/Fraunces) (display) + [Inter](https://fonts.google.com/specimen/Inter) (body), via Google Fonts |
| Interactivity  | Vanilla JavaScript (ES6+), organized into small modules (`Storage`, `Validate`, `UI`, `Nav`, `Auth`, `Dashboard`) |
| Persistence    | `localStorage` (accounts, session, per-user course/activity data) — a stand-in for a real backend/database |
| Tooling        | None required — no build step, no bundler, no `npm install` |

> This is intentionally a **frontend-only** project. Accounts and sessions
> live in the browser's `localStorage`, which is great for demos and
> prototyping but is not a substitute for real authentication — see
> [Connecting a real backend](#6-connecting-a-real-backend) below.

## 4. Project Structure

```
lms-portal/
├── index.html              # Marketing home page
├── login.html               # Sign in
├── register.html            # Create account (Student / Admin)
├── forgot-password.html     # Step 1 of password recovery — request a code
├── reset-password.html      # Step 2 of password recovery — OTP + new password
├── dashboard.html            # Authenticated student dashboard
├── css/
│   └── style.css            # Design tokens + all page styles, responsive
├── js/
│   └── script.js             # LMS.* modules + per-page wiring
├── docs/                    # (optional) space for screenshots, diagrams
└── README.md
```

## 5. Getting Started

No build tools needed.

```bash
git clone https://github.com/<your-username>/lms-portal.git
cd lms-portal
```

Then just open `index.html` in a browser, **or** serve it locally (recommended,
so relative paths behave exactly like production):

```bash
# Python
python3 -m http.server 5500

# or Node
npx serve .
```

Visit `http://localhost:5500`.

### Try the demo flow

1. Go to **Register**, create an account (any real-looking email works).
2. You're taken straight to the **Dashboard**.
3. Log out, then log back in from **Login** with the same credentials.
4. Try **Forgot password** → use the demo code `123456` on the reset screen.

## 6. Connecting a Real Backend

The whole app talks to persistence through one module — `LMS.Storage` in
`js/script.js`. To move off `localStorage`:

1. Replace the methods in `Storage` (`addUser`, `findUserByEmail`,
   `setSession`, `getCourseData`, etc.) with `fetch()` calls to your API.
2. Keep every other module (`Validate`, `UI`, `Nav`, `Auth`, `Dashboard`)
   as-is — they only ever call `Storage`, never touch `localStorage`
   directly, so the swap is isolated to one file.
3. Move password verification and OTP generation/checking server-side —
   the current OTP (`123456`) and password obfuscation are demo-only and
   must not be used in production.

## 7. Roadmap Ideas

- Real backend + database (Node/Express + PostgreSQL, or similar)
- Course catalog and enrollment pages (currently seeded demo data)
- Email delivery for the OTP instead of a fixed demo code
- Admin role dashboard (the register page already captures the role)
- Automated tests for the validation and auth modules

## License

This project is provided as a learning/demo template — feel free to fork,
modify, and use it as the starting point for your own LMS project.
