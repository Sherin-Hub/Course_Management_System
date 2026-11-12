const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const controller = require("../controllers/enrollmentController");
const { enrollValidation, courseIdParamValidation } = require("../validators/enrollmentValidators");

// Every route needs a login; the student is always taken from the JWT, never from the request.
router.get("/me", authenticateToken, controller.listMine);
router.post("/", authenticateToken, enrollValidation, validateRequest, controller.enroll);
router.delete("/:courseId", authenticateToken, courseIdParamValidation, validateRequest, controller.withdraw);

module.exports = router;
