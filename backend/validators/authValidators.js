const { body } = require("express-validator");

// Lower-case only. The default normalizeEmail() also strips dots from Gmail
// addresses, which would make "a.b@gmail.com" register as "ab@gmail.com" and
// then fail to log in; these options keep register and login consistent.
const NORMALIZE = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false
};

const registerValidation = [
  body("name")
    .isString()
    .withMessage("Name is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must be 100 characters or fewer"),

  body("email")
    .isString()
    .bail()
    .isEmail()
    .withMessage("Valid email is required")
    .isLength({ max: 254 })
    .withMessage("Email is too long")
    .normalizeEmail(NORMALIZE),

  body("password")
    .isString()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 12 })
    .withMessage("Password must contain at least 12 characters")
    // bcrypt only uses the first 72 bytes of a password
    .isLength({ max: 72 })
    .withMessage("Password must be 72 characters or fewer"),

  // Required by the User model.
  body("department")
    .isString()
    .withMessage("Department is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Department is required")
    .isLength({ max: 100 })
    .withMessage("Department must be 100 characters or fewer"),

  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Phone must be text")
    .bail()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone must be 20 characters or fewer")
];

const loginValidation = [
  body("email")
    .isString()
    .bail()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(NORMALIZE),
  body("password")
    .isString()
    .bail()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ max: 72 })
    .withMessage("Password must be 72 characters or fewer")
];

module.exports = {
  registerValidation,
  loginValidation
};
