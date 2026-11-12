const express = require("express");
const router = express.Router();

const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const controller = require("../controllers/studentController");
const { paginationQuery } = require("../validators/commonValidators");
const {
  createStudentValidation,
  updateStudentValidation,
  studentIdValidation,
} = require("../validators/studentValidators");

// Student records (MongoDB users with role "student"). Admin only.
router.use(authenticateToken, requireAdmin);

router.get("/", paginationQuery, validateRequest, controller.list);
router.post("/", createStudentValidation, validateRequest, controller.create);
router.put("/:id", updateStudentValidation, validateRequest, controller.update);
router.delete("/:id", studentIdValidation, validateRequest, controller.remove);

module.exports = router;
