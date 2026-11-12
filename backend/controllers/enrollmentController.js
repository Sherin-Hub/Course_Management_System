const enrollmentService = require("../services/enrollmentService");
const { notifyUser } = require("../services/notificationService");

// GET /api/v1/enrollments/me
async function listMine(req, res, next) {
  try {
    const enrollments = await enrollmentService.listForStudent(req.user.sub);
    res.status(200).json({ enrollments });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/enrollments   { courseId }
async function enroll(req, res, next) {
  try {
    const { dto, course } = await enrollmentService.enroll(req.user.sub, req.body.courseId);
    await notifyUser(req.app, req.user.sub, `You enrolled in "${course.title}"`);
    res.status(201).json({ enrollment: dto });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/enrollments/:courseId   (unenroll = status "withdrawn", history is kept)
async function withdraw(req, res, next) {
  try {
    const { dto } = await enrollmentService.withdraw(req.user.sub, req.params.courseId);
    res.status(200).json({ enrollment: dto });
  } catch (error) {
    next(error);
  }
}

module.exports = { listMine, enroll, withdraw };
