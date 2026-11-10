const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");
const loginLimiter = require("../middleware/loginLimiter");
const validateRequest = require("../middleware/validateRequest");
const {
  registerValidation,
  loginValidation
} = require("../validators/authValidators");

router.post(
  "/register",
  registerValidation,
  validateRequest,
  authController.register
);

// Order matters: rate limit first, then validate, then the controller.
router.post(
  "/login",
  loginLimiter,
  loginValidation,
  validateRequest,
  authController.login
);

router.get("/me", authenticateToken, authController.me);

module.exports = router;
