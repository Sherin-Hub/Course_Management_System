const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication token is required",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      message: "Authentication token is required",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "Authentication is not configured",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // `sub` is the MongoDB user _id. `id` is kept as an alias.
    req.user = {
      id: decoded.sub,
      sub: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

// Use after authenticateToken. The role is read from MongoDB on every call
// (not from the token), so a demoted or deleted admin loses access at once.
async function requireAdmin(req, res, next) {
  try {
    const validId = mongoose.Types.ObjectId.isValid(req.user.id);
    const user = validId
      ? await User.findById(req.user.id).select("role")
      : null;

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
};
