const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courseController");
const validateRequest = require("../middleware/validateRequest");
const {
  authenticateToken,
  requireAdmin
} = require("../middleware/authMiddleware");
const { paginationQuery } = require("../validators/commonValidators");
const {
  createCourseValidation,
  updateCourseValidation,
  courseIdValidation
} = require("../validators/courseValidators");

// Public: anyone can browse courses (optional ?page=1&limit=20).
router.get(
  "/",
  paginationQuery,
  validateRequest,
  courseController.getAllCourses
);
router.get(
  "/:id",
  courseIdValidation,
  validateRequest,
  courseController.getCourseById
);

// Changes need a valid JWT AND an admin account.
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  createCourseValidation,
  validateRequest,
  courseController.createCourse
);
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  updateCourseValidation,
  validateRequest,
  courseController.updateCourse
);
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  courseIdValidation,
  validateRequest,
  courseController.deleteCourse
);

module.exports = router;
