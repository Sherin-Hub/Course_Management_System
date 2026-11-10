const { rateLimit } = require("express-rate-limit");
const config = require("../config");

// 10 login attempts per IP per 15 minutes (change with LOGIN_RATE_LIMIT).
// Only FAILED attempts are counted, so a student who logs in successfully a
// few times is never locked out, but password guessing is stopped.
// NOTE: the counter lives in this process's memory. With several server
// instances, use a shared store (for example Redis) instead.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.loginRateLimit,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Try again later."
  }
});

module.exports = loginLimiter;
