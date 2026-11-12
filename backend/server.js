require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const config = require("./config");
const connectDB = require("./config/db");
const initializeSocket = require("./config/socket");
const models = require("./models"); // registers every Mongoose schema
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const learningProgressRoutes = require("./routes/learningProgressRoutes");
const studentRoutes = require("./routes/studentRoutes");
const { ensureStarterCourses } = require("./config/starterCourses");
const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Render, Vercel and most hosts put a reverse proxy in front of Node. Without
// this, every visitor looks like the proxy's IP, so the login rate limiter
// would count ALL users together. "1" = trust exactly one proxy hop.
if (config.isProduction || process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

// ---------------------------------------------------------------------------
// 1. Security headers, CORS, logging and request parsing (before any route)
// ---------------------------------------------------------------------------

// Task 14.5: basic security headers.
app.use(helmet());

// Task 14.1: only trusted browser origins (CLIENT_URL, comma-separated).
// Requests with no Origin header (Postman, curl, server-to-server) are allowed.
// Socket.IO uses the same list (config/socket.js).
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(
        Object.assign(new Error("Origin not allowed by CORS"), { status: 403 })
      );
    },
    // Lets the browser read the pagination headers sent by GET /courses.
    exposedHeaders: ["X-Total-Count", "X-Page", "X-Limit", "X-Total-Pages"],
  })
);

// Task 14.8: request logging. "combined" logs IP, method, URL, status and
// user-agent - never request bodies, passwords or Authorization headers.
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

app.use(express.json({ limit: "100kb" }));

// ---------------------------------------------------------------------------
// 2. API routes
// ---------------------------------------------------------------------------

// Course CRUD (GET public, writes need an admin JWT inside courseRoutes).
app.use("/api/v1/courses", courseRoutes);

// Authentication routes.
app.use("/api/v1/auth", authRoutes);

// Logged-in student's own profile.
app.use("/api/v1/profile", profileRoutes);

// Enrollments, learning progress and student records (all stored in MongoDB).
app.use("/api/v1/enrollments", enrollmentRoutes);
app.use("/api/v1/progress", learningProgressRoutes);
app.use("/api/v1/students", studentRoutes); // admin only

// Task 13: chat history and notifications (JWT required).
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Task 15.9: health checks (Render pings /api/health to know the app is alive).
// /api/health only proves Express answers; /api/health/db also checks MongoDB.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running"
  });
});

app.get("/api/health/db", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "unavailable",
    database: connected ? "connected" : "disconnected"
  });
});

// ---------------------------------------------------------------------------
// 3. Unknown-route handler, then 4. the centralized error handler (LAST)
// ---------------------------------------------------------------------------
app.use(notFoundMiddleware);
app.use(errorHandler);

// Task 13.3: Socket.IO needs the raw HTTP server, not just the Express app.
const server = http.createServer(app);

const PORT = config.port;
let io = null;
let shuttingDown = false;

// Task 14.10: stop accepting connections, let active ones finish, close
// Socket.IO and MongoDB, then exit. A timer forces exit if something hangs.
async function shutdown(reason, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Shutting down (${reason})...`);

  const forceExit = setTimeout(() => {
    console.error("Graceful shutdown timed out; forcing exit.");
    process.exit(exitCode || 1);
  }, 10000);
  forceExit.unref();

  try {
    // io.close() disconnects every socket and also closes the HTTP server.
    if (io) {
      await new Promise((resolve) => io.close(resolve));
    } else if (server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
    console.log("HTTP server and MongoDB connection closed.");
  } catch (error) {
    console.error("Error during shutdown:", error);
    exitCode = exitCode || 1;
  }

  process.exit(exitCode);
}

async function startServer() {
  // Task 14.10: log, then shut down cleanly. In production a process manager
  // (pm2, systemd, Docker, your hosting platform) should restart the app.
  process.on("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error);
    shutdown("unhandledRejection", 1);
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    shutdown("uncaughtException", 1);
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Refuse to start in production with an unsafe configuration.
  if (config.isProduction) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error("JWT_SECRET must be set to a random value of at least 32 characters in production.");
      process.exit(1);
    }
    if (!process.env.CLIENT_URL) {
      console.warn("WARNING: CLIENT_URL is not set; browsers on your deployed frontend will be blocked by CORS.");
    }
    if (config.allowedOrigins.some((origin) => origin === "*")) {
      console.error("CLIENT_URL must list real origins, not *.");
      process.exit(1);
    }
  }

  try {
    await connectDB();

    // Make sure unique indexes (e.g. users.email) exist before accepting traffic.
    await Promise.all(Object.values(models).map((model) => model.init()));

    io = initializeSocket(server);
    app.set("io", io); // lets controllers push live notifications

    // Fresh database? Add the starter courses so students can browse and enroll.
    await ensureStarterCourses();

    // There must be only ONE listener on the port: the HTTP server that
    // carries both Express and Socket.IO.
    server.on("error", (error) => {
      console.error(
        error.code === "EADDRINUSE"
          ? `Port ${PORT} is already in use. Stop the other process or change PORT in .env.`
          : error
      );
      shutdown("server error", 1);
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
