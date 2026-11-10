const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const config = require("./index");
const User = require("../models/User");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

// Errors the user is allowed to see. Anything else (for example a database
// failure) is logged on the server and reported to the client generically.
class ClientError extends Error {}

// --- Basic abuse control (the spec asks for rate limits before production) ---
// Each user may send at most MESSAGE_LIMIT messages per MESSAGE_WINDOW_MS.
// Kept in this process's memory; use a shared store if you run several servers.
const MESSAGE_LIMIT = 20;
const MESSAGE_WINDOW_MS = 10 * 1000;
const sendTimes = new Map(); // userId -> [timestamps]

function isRateLimited(userId) {
  const now = Date.now();
  const recent = (sendTimes.get(userId) || []).filter(
    (time) => now - time < MESSAGE_WINDOW_MS
  );

  if (recent.length >= MESSAGE_LIMIT) {
    sendTimes.set(userId, recent);
    return true;
  }

  recent.push(now);
  sendTimes.set(userId, recent);
  return false;
}

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    // Same trusted origins as the Express CORS setup (config/index.js).
    cors: {
      origin: config.allowedOrigins,
      methods: ["GET", "POST"]
    },
    // A message is at most 2000 characters; refuse oversized packets.
    maxHttpBufferSize: 16 * 1024
  });

  // Authenticate the socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
        { algorithms: ["HS256"] }
      );

      const user = await User.findById(decoded.sub)
        .select("_id name role");

      if (!user) {
        return next(
          new Error("User not found")
        );
      }

      // The sender identity comes from the verified token, never from the client.
      socket.user = {
        id: String(user._id),
        name: user.name,
        role: user.role
      };

      next();
    } catch (error) {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    // Each authenticated user has a private room
    socket.join(`user:${userId}`);
    console.log("Socket connected:", userId);

    socket.on("send_message", async (data, ack) => {
      try {
        const { recipientId, text } = data || {};

        if (
          !mongoose.isValidObjectId(recipientId) ||
          typeof text !== "string" ||
          !text.trim() ||
          text.trim().length > 2000
        ) {
          throw new ClientError("Invalid message data");
        }

        if (String(recipientId) === userId) {
          throw new ClientError("You cannot send a message to yourself");
        }

        if (isRateLimited(userId)) {
          throw new ClientError("You are sending messages too quickly");
        }

        const recipient = await User.findById(
          recipientId
        ).select("_id");

        if (!recipient) {
          throw new ClientError("Recipient not found");
        }

        const message = await Message.create({
          sender: userId,
          recipient: recipientId,
          text: text.trim()
        });

        const payload = {
          _id: message._id,
          sender: userId,
          recipient: String(recipientId),
          text: message.text,
          createdAt: message.createdAt
        };

        // To the sender's room (all their open tabs) and the recipient's room.
        io.to(`user:${userId}`)
          .to(`user:${recipientId}`)
          .emit("receive_message", payload);

        const notification = await Notification.create({
          recipient: recipientId,
          message: `New message from ${socket.user.name}`
        });

        io.to(`user:${recipientId}`).emit(
          "new_notification",
          notification
        );

        if (typeof ack === "function") {
          ack({ success: true });
        }
      } catch (error) {
        if (!(error instanceof ClientError)) {
          console.error("send_message failed:", error);
        }

        if (typeof ack === "function") {
          ack({
            success: false,
            message:
              error instanceof ClientError
                ? error.message
                : "Unable to send message"
          });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", userId);
    });
  });

  return io;
}

module.exports = initializeSocket;
