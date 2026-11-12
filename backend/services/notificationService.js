const Notification = require("../models/Notification");

// Saves a notification in MongoDB and, if the user is online, pushes it over
// Socket.IO ("new_notification") so it appears without a page refresh.
// `app` is the Express app (server.js stores the Socket.IO server with app.set("io", io)).
async function notifyUser(app, userId, message) {
  const notification = await Notification.create({ recipient: userId, message });

  const io = app && app.get("io");
  if (io) io.to(`user:${userId}`).emit("new_notification", notification);

  return notification;
}

module.exports = { notifyUser };
