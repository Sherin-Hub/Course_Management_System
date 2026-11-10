const { body } = require("express-validator");

const updateProfileValidation = [
  body("name")
    .isString()
    .withMessage("Valid name is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Valid name is required")
    .isLength({ max: 100 })
    .withMessage("Name must be 100 characters or fewer"),

  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be text")
    .bail()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone must be 20 characters or fewer")
];

module.exports = { updateProfileValidation };
