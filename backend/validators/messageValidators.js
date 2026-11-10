const { objectIdParam } = require("./commonValidators");

const conversationValidation = [objectIdParam("userId")];

module.exports = { conversationValidation };
