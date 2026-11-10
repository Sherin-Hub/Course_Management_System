// Production-ready wrapper around json-server (the demo "mock API").
//  - listens on process.env.PORT (Render provides it), default 5001
//  - CORS limited to CLIENT_URL in production (comma-separated, no trailing slash)
//  - /health endpoint for the host's health check
//
// Data lives in db.json. On Render's free plan the disk is ephemeral: changes
// are lost whenever the service restarts or redeploys (the file resets to the
// version in GitHub). Treat this as DEMO data only.
const path = require("path");
const jsonServer = require("json-server");
const cors = require("cors");

const PORT = Number(process.env.PORT) || 5001;
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

if (isProduction && allowedOrigins.length === 0) {
  console.warn("WARNING: CLIENT_URL is not set; browsers on your deployed frontend will be blocked by CORS.");
}

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db.json"));

server.use(
  cors({
    origin(origin, callback) {
      // No Origin header = curl / server-to-server. In development with no
      // CLIENT_URL configured, allow any browser origin for convenience.
      if (!origin || (!isProduction && allowedOrigins.length === 0) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(Object.assign(new Error("Origin not allowed by CORS"), { status: 403 }));
    },
  })
);

server.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Mock API is running" });
});

server.use(jsonServer.defaults({ noCors: true, logger: !isProduction }));
server.use(router);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Mock API running on port ${PORT}`);
});
