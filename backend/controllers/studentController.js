const studentService = require("../services/studentService");

// All of these routes are admin-only (see routes/studentRoutes.js).

async function list(req, res, next) {
  try {
    res.status(200).json(await studentService.list(req.query));
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json({ student: await studentService.create(req.body) });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    res.status(200).json({ student: await studentService.update(req.params.id, req.body) });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await studentService.remove(req.params.id);
    res.status(200).json({ message: "Student deleted" });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update, remove };
