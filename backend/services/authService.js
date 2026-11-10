const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

function publicStudent(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    department: user.department,
    ...(user.phone ? { phone: user.phone } : {}),
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function registerStudent({ name, email, password, department, phone }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (await User.exists({ email: normalizedEmail })) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // The role is always "student" here: it is never taken from the request body.
  // (If two requests race past the check above, the unique index on email
  // makes the second create() fail with code 11000 -> 409 in errorHandler.)
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    department: department.trim(),
    phone: typeof phone === "string" ? phone.trim() : "",
    role: "student",
  });

  return publicStudent(user);
}

async function loginStudent({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // passwordHash is select:false on the model, so ask for it explicitly.
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+passwordHash"
  );

  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return publicStudent(user);
}

// Used by GET /auth/me so the frontend can restore a session from a token.
async function getStudentById(id) {
  const user = mongoose.Types.ObjectId.isValid(id)
    ? await User.findById(id)
    : null;

  if (!user) {
    const error = new Error("Student account no longer exists");
    error.statusCode = 401;
    throw error;
  }
  return publicStudent(user);
}

module.exports = {
  registerStudent,
  loginStudent,
  getStudentById,
};
