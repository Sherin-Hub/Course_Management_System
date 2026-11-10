// Convenience loader: require("./models") registers every schema.
module.exports = {
  User: require("./User"),
  Course: require("./Course"),
  Enrollment: require("./Enrollment"),
  LearningProgress: require("./LearningProgress"),
  Notification: require("./Notification"),
  Message: require("./Message"),
};
