const { objectIdParam } = require("./commonValidators");

const notificationIdValidation = [objectIdParam("id")];

module.exports = { notificationIdValidation };
