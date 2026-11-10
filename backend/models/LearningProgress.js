const mongoose = require("mongoose");

const learningProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    completedLessons: { type: Number, default: 0, min: 0 },
    totalLessons: { type: Number, default: 0, min: 0 },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 }
  },
  { timestamps: true }
);

// Keep progressPercentage consistent with the lesson counts.
learningProgressSchema.pre("validate", function (next) {
  if (this.completedLessons > this.totalLessons) {
    this.invalidate(
      "completedLessons",
      "completedLessons cannot be greater than totalLessons"
    );
  }
  this.progressPercentage =
    this.totalLessons > 0
      ? Math.round((this.completedLessons / this.totalLessons) * 100)
      : 0;
  next();
});

// One progress record per student per course.
learningProgressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("LearningProgress", learningProgressSchema);
