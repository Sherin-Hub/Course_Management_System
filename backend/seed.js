// Usage: npm run seed
// Safe to run more than once: it only inserts what is missing.
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { User, Course } = require("./models");

const COURSES = [
  { title: "Python Programming", icon: "🐍", category: "Programming" },
  { title: "Modern Web Development", icon: "🌐", category: "Programming" },
  { title: "UI / UX Design Foundations", icon: "🎨", category: "Design" },
  { title: "Data Analysis with SQL", icon: "📊", category: "Data" },
  { title: "Machine Learning Basics", icon: "🤖", category: "Data" },
  { title: "Project Management Essentials", icon: "🗂️", category: "Business" },
];

const ADMIN = {
  name: "LMS Admin",
  email: (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase(),
  password: process.env.ADMIN_PASSWORD || "admin123",
  department: "Administration",
};

async function seed() {
  await connectDB();

  // Courses: inserted in order, matched by title so re-running adds nothing.
  let addedCourses = 0;
  for (const course of COURSES) {
    if (!(await Course.exists({ title: course.title }))) {
      await Course.create(course);
      addedCourses += 1;
    }
  }

  // Admin account: created once, an existing one is never overwritten.
  // In production the demo password "admin123" is never used: set ADMIN_PASSWORD
  // (12+ characters) or use `npm run create-admin` instead.
  const defaultPasswordInProduction =
    process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD;
  if (defaultPasswordInProduction) {
    console.warn("NODE_ENV=production and ADMIN_PASSWORD not set: admin account NOT created. Run `npm run create-admin`.");
  }

  let adminCreated = false;
  if (!defaultPasswordInProduction && !(await User.exists({ email: ADMIN.email }))) {
    await User.create({
      name: ADMIN.name,
      email: ADMIN.email,
      passwordHash: await bcrypt.hash(ADMIN.password, 12),
      department: ADMIN.department,
      role: "admin",
    });
    adminCreated = true;
  }

  console.log(`Courses added: ${addedCourses} (of ${COURSES.length})`);
  if (adminCreated) {
    console.log(`Admin created: ${ADMIN.email} (change this password before sharing the project)`);
  } else if (!defaultPasswordInProduction) {
    console.log(`Admin already exists: ${ADMIN.email}`);
  }
}

seed()
  .catch((error) => {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
