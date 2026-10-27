function validateCourse(req, res, next) {
  const { title, category, icon } = req.body || {};

  if (
    typeof title !== "string" ||
    typeof category !== "string" ||
    !title.trim() ||
    !category.trim()
  ) {
    return res.status(400).json({
      message: "Course title and category are required",
    });
  }

  if (icon !== undefined && typeof icon !== "string") {
    return res.status(400).json({ message: "Course icon must be text" });
  }

  next();
}

module.exports = { validateCourse };
