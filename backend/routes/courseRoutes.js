const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courseController");
const { validateCourse } = require("../middleware/courseValidation");
const { authenticateToken } = require("../middleware/authMiddleware");

// Public: anyone can browse courses.
router.get("/", courseController.getAllCourses);
router.get("/:id", courseController.getCourseById);

// Login required (valid JWT) for changes.
router.post("/", authenticateToken, validateCourse, courseController.createCourse);
router.put("/:id", authenticateToken, validateCourse, courseController.updateCourse);
router.delete("/:id", authenticateToken, courseController.deleteCourse);

module.exports = router;
