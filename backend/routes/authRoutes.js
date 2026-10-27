const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/authValidation");

router.post("/register", validateRegistration, authController.register);
router.post("/login", validateLogin, authController.login);
router.get("/me", authenticateToken, authController.me);

module.exports = router;
