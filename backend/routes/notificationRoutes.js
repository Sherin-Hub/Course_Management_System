const express = require("express");
const Notification = require("../models/Notification");
const { authenticateToken } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  notificationIdValidation
} = require("../validators/notificationValidators");

const router = express.Router();

// GET /api/v1/notifications -> the logged-in user's 50 newest notifications
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.sub
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/notifications/:id/read
// The recipient is part of the filter, so you can only mark YOUR notifications.
router.patch(
  "/:id/read",
  authenticateToken,
  notificationIdValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          recipient: req.user.sub
        },
        { $set: { isRead: true } },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          message: "Notification not found"
        });
      }

      res.json({ notification });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
