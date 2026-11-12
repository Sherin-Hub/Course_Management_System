const { body } = require("express-validator");
const { objectIdParam } = require("./commonValidators");

const enrollValidation = [
  body("courseId").isString().bail().isMongoId().withMessage("A valid courseId is required"),
];

const courseIdParamValidation = [objectIdParam("courseId")];

module.exports = { enrollValidation, courseIdParamValidation };
