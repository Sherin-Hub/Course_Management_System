const Course = require("../models/Course");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function notFound() {
  const error = new Error("Course not found");
  error.statusCode = 404;
  return error;
}

// .lean() returns plain objects (faster, no Mongoose document overhead) but
// skips the model's toJSON transform, so do the same shaping here:
// _id -> id, and no __v. The React app reads `course.id`.
function toCourse(doc) {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

// Returns { courses, page, limit, total, totalPages }.
// page/limit are clamped here as well as in the route validator.
async function getAllCourses({ page, limit } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(limit, 10) || DEFAULT_LIMIT)
  );

  const [docs, total] = await Promise.all([
    Course.find()
      .sort({ _id: 1 }) // _id order == creation order
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Course.countDocuments()
  ]);

  return {
    courses: docs.map(toCourse),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit))
  };
}

async function getCourseById(id) {
  const course = await Course.findById(id).lean();
  if (!course) throw notFound();
  return toCourse(course);
}

async function createCourse({ title, icon, category }) {
  return Course.create({
    title: title.trim(),
    category: category.trim(),
    // omit icon when blank so the schema default is applied
    ...(typeof icon === "string" && icon.trim() ? { icon: icon.trim() } : {}),
  });
}

async function updateCourse(id, { title, icon, category }) {
  const changes = { title: title.trim(), category: category.trim() };
  if (typeof icon === "string" && icon.trim()) changes.icon = icon.trim();

  const course = await Course.findByIdAndUpdate(
    id,
    { $set: changes },
    { new: true, runValidators: true }
  );
  if (!course) throw notFound();
  return course;
}

async function deleteCourse(id) {
  const course = await Course.findByIdAndDelete(id);
  if (!course) throw notFound();
  return course;
}

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
