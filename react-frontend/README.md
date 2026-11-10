# LMS Portal — React frontend

See the top-level `README.md` for how to run the backend, mock API and frontend together,
and `docs/deployment-guide.md` for deploying to Vercel.

Environment variables (see `.env.example`). They are read when the app is **built**, so redeploy after changing them:

- `VITE_API_URL` — Express backend REST API, e.g. `http://localhost:5000/api/v1`
- `VITE_SOCKET_URL` — Express backend origin for Socket.IO (no `/api/v1`), e.g. `http://localhost:5000`
- `VITE_MOCK_API_URL` — json-server demo API, e.g. `http://localhost:5001`

In development a missing variable falls back to the localhost value above. In a production build there is
no fallback: a missing value is logged in the browser console.

`vercel.json` rewrites every path to `index.html` so refreshing `/dashboard` works on Vercel.
