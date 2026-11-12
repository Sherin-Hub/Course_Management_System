const { body } = require("express-validator");
const { objectIdParam } = require("./commonValidators");
const { NORMALIZE } = require("./authValidators");

const text = (field, label, max, { optional = false } = {}) => {
  let chain = body(field);
  if (optional) chain = chain.optional();
  return chain
    .isString()
    .withMessage(`${label} must be text`)
    .bail()
    .trim()
    .isLength({ max })
    .withMessage(`${label} must be ${max} characters or fewer`);
};

const createStudentValidation = [
  text("name", "Name", 100).notEmpty().withMessage("Name is required"),
  body("email")
    .isString()
    .bail()
    .isEmail()
    .withMessage("Valid email is required")
    .isLength({ max: 254 })
    .normalizeEmail(NORMALIZE),
  body("password")
    .isString()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 12, max: 72 })
    .withMessage("Password must be 12 to 72 characters"),
  text("department", "Department", 100, { optional: true }),
  text("phone", "Phone", 20, { optional: true }),
];

const updateStudentValidation = [
  objectIdParam("id"),
  text("name", "Name", 100, { optional: true }).notEmpty().withMessage("Name cannot be empty"),
  body("email")
    .optional()
    .isString()
    .bail()
    .isEmail()
    .withMessage("Valid email is required")
    .isLength({ max: 254 })
    .normalizeEmail(NORMALIZE),
  // Leave out (or send "") to keep the current password.
  body("password")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .isLength({ min: 12, max: 72 })
    .withMessage("Password must be 12 to 72 characters"),
  text("department", "Department", 100, { optional: true }),
  text("phone", "Phone", 20, { optional: true }),
];

const studentIdValidation = [objectIdParam("id")];

module.exports = { createStudentValidation, updateStudentValidation, studentIdValidation };
