const mongoose = require("mongoose");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const LearningProgress = require("../models/LearningProgress");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const httpError = require("./httpError");

// Courses do not define lessons yet, so every course counts as 20 lessons.
const LESSONS_PER_COURSE = 20;

function courseSummary(course) {
  return {
    id: String(course._id),
    title: course.title,
    icon: course.icon,
    category: course.category,
  };
}

// One flat object per enrollment: enrollment + course + progress.
function toDto(enrollment, course, progress) {
  const totalLessons = progress?.totalLessons || LESSONS_PER_COURSE;
  const completedLessons = progress?.completedLessons || 0;

  return {
    id: String(enrollment._id),
    courseId: String(course._id),
    course: courseSummary(course),
    status: enrollment.status, // active | completed | withdrawn
    enrolledAt: enrollment.enrolledAt,
    updatedAt: enrollment.updatedAt,
    completedLessons,
    totalLessons,
    progressPercentage: progress?.progressPercentage || 0,
    progressUpdatedAt: progress?.updatedAt || null,
  };
}

async function getOrCreateProgress(studentId, courseId) {
  let progress = await LearningProgress.findOne({ student: studentId, course: courseId });
  if (!progress) {
    progress = await LearningProgress.create({
      student: studentId,
      course: courseId,
      completedLessons: 0,
      totalLessons: LESSONS_PER_COURSE,
    });
  }
  return progress;
}

// All of a student's enrollments (including withdrawn ones, which the UI uses for history).
async function listForStudent(studentId) {
  const [enrollments, progressRecords] = await Promise.all([
    Enrollment.find({ student: studentId }).populate("course").sort({ enrolledAt: 1 }).lean(),
    LearningProgress.find({ student: studentId }).lean(),
  ]);

  const progressByCourse = new Map(progressRecords.map((item) => [String(item.course), item]));

  return enrollments
    .filter((item) => item.course) // course was deleted: skip
    .map((item) => toDto(item, item.course, progressByCourse.get(String(item.course._id))));
}

async function enroll(studentId, courseId) {
  const course = await Course.findById(courseId);
  if (!course) throw httpError(404, "Course not found");

  const existing = await Enrollment.findOne({ student: studentId, course: courseId });

  if (existing && existing.status !== "withdrawn") {
    throw httpError(409, "You are already enrolled in this course");
  }

  const progress = await getOrCreateProgress(studentId, courseId);
  const alreadyFinished = progress.completedLessons >= progress.totalLessons && progress.totalLessons > 0;

  let enrollment;
  if (existing) {
    // Re-enrolment after withdrawing: keep the old progress and history.
    existing.status = alreadyFinished ? "completed" : "active";
    existing.enrolledAt = new Date();
    enrollment = await existing.save();
  } else {
    // A race between two identical requests ends in the unique index (code 11000 -> 409).
    enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      status: alreadyFinished ? "completed" : "active",
    });
  }

  return { dto: toDto(enrollment, course, progress), course };
}

// "Unenroll" = status withdrawn. The record and the progress are kept (history).
async function withdraw(studentId, courseId) {
  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
  if (!enrollment || enrollment.status === "withdrawn") {
    throw httpError(404, "You are not enrolled in this course");
  }

  enrollment.status = "withdrawn";
  await enrollment.save();

  const [course, progress] = await Promise.all([
    Course.findById(courseId),
    LearningProgress.findOne({ student: studentId, course: courseId }),
  ]);

  return { dto: toDto(enrollment, course || { _id: courseId, title: "Deleted course" }, progress), course };
}

// Set progress either as a lesson count or as a percentage.
async function setProgress(studentId, courseId, { completedLessons, progressPercentage }) {
  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
  if (!enrollment || enrollment.status === "withdrawn") {
    throw httpError(404, "You are not enrolled in this course");
  }

  const course = await Course.findById(courseId);
  if (!course) throw httpError(404, "Course not found");

  const progress = await getOrCreateProgress(studentId, courseId);
  const total = progress.totalLessons || LESSONS_PER_COURSE;
  progress.totalLessons = total;

  let lessons =
    completedLessons !== undefined
      ? completedLessons
      : Math.round((progressPercentage / 100) * total);
  lessons = Math.max(0, Math.min(total, lessons));

  progress.completedLessons = lessons;
  await progress.save(); // the model's validate hook recalculates progressPercentage

  const wasCompleted = enrollment.status === "completed";
  enrollment.status = lessons >= total ? "completed" : "active";
  await enrollment.save();

  return {
    dto: toDto(enrollment, course, progress),
    course,
    justCompleted: !wasCompleted && enrollment.status === "completed",
  };
}

async function listProgressForStudent(studentId) {
  const items = await listForStudent(studentId);
  return items.filter((item) => item.status !== "withdrawn");
}

// Used when an admin deletes a student: remove everything that belongs to them.
async function cleanupStudent(studentId) {
  const id = new mongoose.Types.ObjectId(String(studentId));
  await Promise.all([
    Enrollment.deleteMany({ student: id }),
    LearningProgress.deleteMany({ student: id }),
    Notification.deleteMany({ recipient: id }),
    Message.deleteMany({ $or: [{ sender: id }, { recipient: id }] }),
  ]);
}

// Used when an admin deletes a course: enrollments in it no longer make sense.
async function cleanupCourse(courseId) {
  await Promise.all([
    Enrollment.deleteMany({ course: courseId }),
    LearningProgress.deleteMany({ course: courseId }),
  ]);
}

// Kept from the Task 11 version of this file (same behaviour, returns the
// Enrollment document). They now share the logic above, so there is one set of rules.
async function enrollStudent(studentId, courseId) {
  await enroll(studentId, courseId);
  return Enrollment.findOne({ student: studentId, course: courseId });
}

async function withdrawStudent(studentId, courseId) {
  await withdraw(studentId, courseId);
  return Enrollment.findOne({ student: studentId, course: courseId });
}

module.exports = {
  enrollStudent,
  withdrawStudent,
  LESSONS_PER_COURSE,
  listForStudent,
  listProgressForStudent,
  enroll,
  withdraw,
  setProgress,
  cleanupStudent,
  cleanupCourse,
};
