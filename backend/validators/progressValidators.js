const { body } = require("express-validator");
const { objectIdParam } = require("./commonValidators");

// Send EITHER completedLessons (whole number) OR progressPercentage (0-100).
const updateProgressValidation = [
  objectIdParam("courseId"),
  body("completedLessons")
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage("completedLessons must be a whole number from 0 to 1000")
    .toInt(),
  body("progressPercentage")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("progressPercentage must be a whole number from 0 to 100")
    .toInt(),
  body().custom((value) => {
    if (value.completedLessons === undefined && value.progressPercentage === undefined) {
      throw new Error("Send completedLessons or progressPercentage");
    }
    return true;
  }),
];

module.exports = { updateProgressValidation };
