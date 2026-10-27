require("dotenv").config();

const express = require("express");
const cors = require("cors");

const config = require("./config");
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

// Existing course CRUD (GET public, writes protected inside courseRoutes).
app.use("/api/v1/courses", courseRoutes);

// Authentication routes.
app.use("/api/v1/auth", authRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`LMS backend running on http://localhost:${config.port}`);
  });
}

module.exports = app;
