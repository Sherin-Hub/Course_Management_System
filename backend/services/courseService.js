const courses = require("../data/courses");

function notFound() {
  const error = new Error("Course not found");
  error.statusCode = 404;
  return error;
}

function nextId() {
  const numbers = courses
    .map((course) => Number(String(course.id).replace(/^c/, "")))
    .filter((n) => Number.isFinite(n));
  return `c${(numbers.length ? Math.max(...numbers) : 0) + 1}`;
}

function getAllCourses() {
  return courses;
}

function getCourseById(id) {
  const course = courses.find((item) => item.id === id);
  if (!course) throw notFound();
  return course;
}

function createCourse({ title, icon, category }) {
  const course = {
    id: nextId(),
    title: title.trim(),
    icon: typeof icon === "string" && icon.trim() ? icon.trim() : "📘",
    category: category.trim(),
  };
  courses.push(course);
  return course;
}

function updateCourse(id, { title, icon, category }) {
  const course = getCourseById(id);
  course.title = title.trim();
  course.category = category.trim();
  if (typeof icon === "string" && icon.trim()) course.icon = icon.trim();
  return course;
}

function deleteCourse(id) {
  const index = courses.findIndex((item) => item.id === id);
  if (index === -1) throw notFound();
  const [removed] = courses.splice(index, 1);
  return removed;
}

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
