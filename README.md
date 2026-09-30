# LMS Portal — React (Vite) version

This is your original LMS Portal (static HTML/CSS/JS) converted into a React
single-page app, while keeping your existing `style.css` and `script.js`
**completely untouched** — they're just copied as-is into `public/`.

## What changed vs. the static site

- Each of your 6 pages is now a React component under `src/pages/`:
  `Home`, `Login`, `Register`, `ForgotPassword`, `ResetPassword`, `Dashboard`.
- Routing is handled by `react-router-dom` in `src/App.jsx`.
- **Routes intentionally use the same `.html` filenames** as your original
  site (`/login.html`, `/dashboard.html`, etc.), not "clean" routes like
  `/login`. That's because `script.js` decides what to do by reading
  `location.pathname` (e.g. it only runs the login-page wiring when the path
  ends in `login.html`), and it redirects with lines like
  `location.href = 'dashboard.html'`. Keeping the same filenames means your
  original auth/validation/dashboard logic works without a single edit.
- `src/components/LegacyBridge.jsx` loads `public/legacy/script.js` once,
  then re-fires `DOMContentLoaded`/`load` every time a page component mounts
  — since React Router doesn't do full page reloads, this is what makes
  your script's per-page `init...Page()` functions run again on every
  navigation, exactly like a fresh page load used to trigger them.
- `public/style.css` is your original CSS, loaded globally from the root
  `index.html`, same as before.
- `localStorage` usage is unchanged — `script.js` still owns all of it
  (`students`, `admins`, the current session, per-user course data, etc.).

## Project structure

```
react-frontend/
├── public/
│   ├── style.css              # your original CSS, unmodified
│   └── legacy/
│       └── script.js          # your original JS, unmodified
├── src/
│   ├── components/
│   │   └── LegacyBridge.jsx   # loads script.js + re-fires page wiring
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   └── Dashboard.jsx
│   ├── App.jsx                 # routes
│   └── main.jsx                # entry point
├── index.html                  # loads Google Fonts + style.css globally
├── package.json
└── vite.config.js
```

## Running it

```bash
npm install
npm run dev
```

Visit the address Vite prints (normally `http://localhost:5173/`).

The demo flow is identical to before: register an account → land on the
dashboard → log out → log back in → try "Forgot password" with OTP `123456`.
