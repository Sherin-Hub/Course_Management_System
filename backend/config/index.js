// Central place to read configuration. dotenv is loaded in server.js first.
//
// CLIENT_URL may hold one origin or several, comma-separated:
//   CLIENT_URL=http://localhost:5173,https://lms.example.com
// (CLIENT_ORIGIN is still read as an older name for the same setting.)
const allowedOrigins = (
  process.env.CLIENT_URL ||
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5173"
)
  .split(",")
  // "https://app.vercel.app/" and "https://app.vercel.app" are the same site,
  // but browsers send the origin WITHOUT a trailing slash, so strip it.
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

module.exports = {
  isProduction: process.env.NODE_ENV === "production",
  // Render supplies PORT in production; 5000 is the local default.
  port: Number(process.env.PORT) || 5000,
  // Shared by Express CORS (server.js) and Socket.IO (config/socket.js),
  // so both trust exactly the same browser origins.
  allowedOrigins,
  loginRateLimit: Number(process.env.LOGIN_RATE_LIMIT) || 10,
};
