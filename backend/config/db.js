const mongoose = require("mongoose");

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Give up after 10 s instead of hanging when Atlas cannot be reached.
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    // Do not print the URI: it contains the database password.
    const hint = /auth/i.test(error.message)
      ? "Check the Atlas database username and password (special characters in the password must be URL-encoded)."
      : /ENOTFOUND|querySrv|ECONNREFUSED|timed out|Server selection/i.test(error.message)
      ? "Check the host in MONGO_URI and Atlas Network Access (the server's IP must be allowed)."
      : "Check MONGO_URI.";
    throw new Error(`MongoDB connection failed: ${error.message}. ${hint}`);
  }

  console.log("MongoDB connected successfully");
}

module.exports = connectDB;
