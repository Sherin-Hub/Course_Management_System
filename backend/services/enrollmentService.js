const Enrollment = require("../models/Enrollment");

// Enroll a student in a course.
// - No record yet            -> create one (status "active")
// - Record is "withdrawn"    -> reactivate it (the unique { student, course }
//                               index would reject a second insert)
// - Record is active/completed -> 409, already enrolled
async function enrollStudent(studentId, courseId) {
  const existing = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  });

  if (!existing) {
    return Enrollment.create({ student: studentId, course: courseId });
  }

  if (existing.status === "withdrawn") {
    existing.status = "active";
    existing.enrolledAt = new Date();
    return existing.save();
  }

  const error = new Error("Student is already enrolled in this course");
  error.statusCode = 409;
  throw error;
}

// Unenroll = status update, NOT deletion, so enrollment history is preserved.
// (Replaces the old findOneAndDelete() approach.)
async function withdrawStudent(studentId, courseId) {
  const enrollment = await Enrollment.findOneAndUpdate(
    { student: studentId, course: courseId, status: { $ne: "withdrawn" } },
    { status: "withdrawn" },
    { new: true }
  );

  if (!enrollment) {
    const error = new Error("Active enrollment not found");
    error.statusCode = 404;
    throw error;
  }
  return enrollment;
}

module.exports = { enrollStudent, withdrawStudent };
