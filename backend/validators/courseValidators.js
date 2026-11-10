const { body } = require("express-validator");
const { objectIdParam } = require("./commonValidators");

const courseBody = [
  body("title")
    .isString()
    .withMessage("Course title is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Course title is required")
    .isLength({ max: 150 })
    .withMessage("Course title must be 150 characters or fewer"),

  body("category")
    .isString()
    .withMessage("Course category is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Course category is required")
    .isLength({ max: 100 })
    .withMessage("Course category must be 100 characters or fewer"),

  // The icon is a short emoji / symbol; blank means "use the default".
  body("icon")
    .optional()
    .isString()
    .withMessage("Course icon must be text")
    .bail()
    .trim()
    .isLength({ max: 16 })
    .withMessage("Course icon must be 16 characters or fewer")
];

const createCourseValidation = courseBody;
const updateCourseValidation = [objectIdParam("id"), ...courseBody];
const courseIdValidation = [objectIdParam("id")];

module.exports = {
  createCourseValidation,
  updateCourseValidation,
  courseIdValidation
};
