const User = require("../models/User");

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.sub).select(
      "name email role department phone createdAt"
    );

    if (!user) {
      return res.status(404).json({
        message: "Profile not found"
      });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body || {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Valid name is required"
      });
    }

    // Only name (required) and phone (optional) can be changed here.
    // Email, role and password are deliberately NOT editable through this
    // route, so a student cannot promote themselves or take over an email.
    const changes = { name: name.trim() };

    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({
          message: "Phone must be text"
        });
      }
      changes.phone = phone.trim();
    }

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { $set: changes },
      { new: true, runValidators: true }
    ).select("name email role department phone");

    if (!user) {
      return res.status(404).json({
        message: "Profile not found"
      });
    }

    res.json({
      message: "Profile updated",
      user
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile
};
