const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const controller = require("../controllers/learningProgressController");
const { updateProgressValidation } = require("../validators/progressValidators");

router.get("/me", authenticateToken, controller.listMine);
router.put("/:courseId", authenticateToken, updateProgressValidation, validateRequest, controller.update);

module.exports = router;
