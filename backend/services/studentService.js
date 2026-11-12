const bcrypt = require("bcryptjs");
const User = require("../models/User");
const httpError = require("./httpError");
const { cleanupStudent } = require("./enrollmentService");

const MAX_LIMIT = 100;

function publicStudent(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    department: user.department,
    phone: user.phone || "",
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function list({ page, limit, search } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(limit, 10) || 50));

  const filter = { role: "student" };
  if (typeof search === "string" && search.trim()) {
    // Escape regex characters so the search text is treated literally.
    const text = search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ name: new RegExp(text, "i") }, { email: new RegExp(text, "i") }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    User.countDocuments(filter),
  ]);

  return {
    students: users.map(publicStudent),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

async function create({ name, email, password, department, phone }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw httpError(409, "Email is already registered");
  }

  // Same hashing as normal registration (bcrypt, cost 12). The role is always "student".
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    department: (department || "General").trim(),
    phone: typeof phone === "string" ? phone.trim() : "",
    role: "student",
  });

  return publicStudent(user);
}

async function update(id, { name, email, phone, department, password }) {
  const user = await User.findOne({ _id: id, role: "student" });
  if (!user) throw httpError(404, "Student not found");

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      if (await User.exists({ email: normalizedEmail, _id: { $ne: user._id } })) {
        throw httpError(409, "Email is already registered");
      }
      user.email = normalizedEmail;
    }
  }
  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (department !== undefined && department.trim()) user.department = department.trim();
  if (password) user.passwordHash = await bcrypt.hash(password, 12);

  await user.save();
  return publicStudent(user);
}

// Deletes the student AND everything that belongs to them (enrollments, progress,
// notifications, messages), so no orphaned records are left behind.
async function remove(id) {
  const user = await User.findOneAndDelete({ _id: id, role: "student" });
  if (!user) throw httpError(404, "Student not found");
  await cleanupStudent(user._id);
  return publicStudent(user);
}

module.exports = { list, create, update, remove };
