const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");

const { authenticateToken } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  conversationValidation
} = require("../validators/messageValidators");

const router = express.Router();

// GET /api/v1/messages/:userId
// The conversation between the logged-in user (from the JWT) and :userId.
// The caller's own id always comes from the token, so nobody can read a
// conversation they are not part of.
router.get(
  "/:userId",
  authenticateToken,
  conversationValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const myId = req.user.sub;
      const otherId = req.params.userId;

      if (
        !mongoose.isValidObjectId(myId) ||
        !mongoose.isValidObjectId(otherId)
      ) {
        return res.status(400).json({
          message: "Invalid user ID"
        });
      }

      const messages = await Message.find({
        $or: [
          { sender: myId, recipient: otherId },
          { sender: otherId, recipient: myId }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      res.json({ messages: messages.reverse() });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
