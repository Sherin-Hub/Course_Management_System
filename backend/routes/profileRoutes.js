const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  updateProfileValidation
} = require("../validators/profileValidators");
const {
  getProfile,
  updateProfile
} = require("../controllers/profileController");

// Profile of the logged-in student (identified by the JWT, never by a URL id,
// so one student can never read or change another student's profile).
// There is intentionally no DELETE here: deleting an account must also clean up
// enrollments, progress, notifications and messages, which is not built yet.
router.get("/", authenticateToken, getProfile);
router.put(
  "/",
  authenticateToken,
  updateProfileValidation,
  validateRequest,
  updateProfile
);

module.exports = router;
