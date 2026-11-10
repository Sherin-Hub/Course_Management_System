const mongoose = require("mongoose");

// Mirrors the fields the Task 9 auth service already uses
// (name, email, passwordHash, department, phone, createdAt).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    // select: false -> never loaded unless explicitly requested with
    // .select("+passwordHash") (only the login check does this).
    passwordHash: { type: String, required: true, select: false },
    department: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "", maxlength: 20 },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student"
    }
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model("User", userSchema);
