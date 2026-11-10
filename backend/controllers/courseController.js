const courseService = require("../services/courseService");

async function getAllCourses(req, res, next) {
  try {
    const { courses, page, limit, total, totalPages } =
      await courseService.getAllCourses(req.query);

    // The body stays a plain array (the React app expects that); paging
    // details travel in headers (exposed to the browser in server.js).
    res.set({
      "X-Total-Count": String(total),
      "X-Page": String(page),
      "X-Limit": String(limit),
      "X-Total-Pages": String(totalPages),
    });
    return res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
}

async function getCourseById(req, res, next) {
  try {
    return res.status(200).json(await courseService.getCourseById(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function createCourse(req, res, next) {
  try {
    const course = await courseService.createCourse(req.body);
    return res.status(201).json({ message: "Course created successfully", course });
  } catch (error) {
    next(error);
  }
}

async function updateCourse(req, res, next) {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);
    return res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    next(error);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const course = await courseService.deleteCourse(req.params.id);
    return res.status(200).json({ message: "Course deleted successfully", course });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
