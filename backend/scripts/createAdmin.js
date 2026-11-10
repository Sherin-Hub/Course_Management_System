// Creates (or promotes) an admin account using the SAME User model and the SAME
// bcrypt hashing (cost 12) as normal registration, so the admin logs in through
// the normal login flow.
//
// Usage (the values are read from the environment, never typed into a file):
//   Windows PowerShell:
//     $env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="a-long-password-123"; npm run create-admin
//   macOS / Linux:
//     ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password-123' npm run create-admin
//
// It uses MONGO_URI from backend/.env. To create the admin in Atlas, set
// MONGO_URI to your Atlas connection string for this one command.
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { User } = require("../models");

async function createAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "LMS Admin").trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Set ADMIN_EMAIL to a valid email address.");
  }
  if (password.length < 12 || password.length > 72) {
    throw new Error("Set ADMIN_PASSWORD to 12-72 characters.");
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    // Never silently change the password of an existing account.
    if (existing.role === "admin") {
      console.log(`${email} is already an admin. Nothing changed.`);
    } else {
      existing.role = "admin";
      await existing.save();
      console.log(`${email} already existed and has been promoted to admin (password unchanged).`);
    }
    return;
  }

  await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    department: "Administration",
    role: "admin",
  });
  console.log(`Admin created: ${email}`);
}

createAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
