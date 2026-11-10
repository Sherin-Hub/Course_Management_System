const mongoose = require("mongoose");

// Mirrors the fields the Task 9 course service already uses
// (title, icon, category). MongoDB generates _id automatically.
const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    icon: { type: String, trim: true, default: "📘" },
    category: { type: String, required: true, trim: true }
  },
  {
    timestamps: true,
    // The React app reads `course.id`, so expose _id as `id` in JSON.
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model("Course", courseSchema);
