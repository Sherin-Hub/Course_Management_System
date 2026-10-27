const courseService = require("../services/courseService");

function getAllCourses(req, res, next) {
  try {
    return res.status(200).json(courseService.getAllCourses());
  } catch (error) {
    next(error);
  }
}

function getCourseById(req, res, next) {
  try {
    return res.status(200).json(courseService.getCourseById(req.params.id));
  } catch (error) {
    next(error);
  }
}

function createCourse(req, res, next) {
  try {
    const course = courseService.createCourse(req.body);
    return res.status(201).json({ message: "Course created successfully", course });
  } catch (error) {
    next(error);
  }
}

function updateCourse(req, res, next) {
  try {
    const course = courseService.updateCourse(req.params.id, req.body);
    return res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    next(error);
  }
}

function deleteCourse(req, res, next) {
  try {
    const course = courseService.deleteCourse(req.params.id);
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
