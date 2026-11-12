const enrollmentService = require("../services/enrollmentService");
const { notifyUser } = require("../services/notificationService");

// GET /api/v1/progress/me
async function listMine(req, res, next) {
  try {
    const progress = await enrollmentService.listProgressForStudent(req.user.sub);
    res.status(200).json({ progress });
  } catch (error) {
    next(error);
  }
}

// PUT /api/v1/progress/:courseId   { completedLessons } or { progressPercentage }
async function update(req, res, next) {
  try {
    const { dto, course, justCompleted } = await enrollmentService.setProgress(
      req.user.sub,
      req.params.courseId,
      {
        completedLessons: req.body.completedLessons,
        progressPercentage: req.body.progressPercentage,
      }
    );

    if (justCompleted) {
      await notifyUser(req.app, req.user.sub, `🎉 You completed "${course.title}"`);
    }

    res.status(200).json({ enrollment: dto });
  } catch (error) {
    next(error);
  }
}

module.exports = { listMine, update };
