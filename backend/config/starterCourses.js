const { Course } = require("../models");

// The six starter courses. Used by `npm run seed` and by the automatic
// "first start" seeding below.
const STARTER_COURSES = [
  { title: "Python Programming", icon: "🐍", category: "Programming" },
  { title: "Modern Web Development", icon: "🌐", category: "Programming" },
  { title: "UI / UX Design Foundations", icon: "🎨", category: "Design" },
  { title: "Data Analysis with SQL", icon: "📊", category: "Data" },
  { title: "Machine Learning Basics", icon: "🤖", category: "Data" },
  { title: "Project Management Essentials", icon: "🗂️", category: "Business" },
];

// Inserts any starter course that is missing (matched by title). Returns how many were added.
async function seedMissingCourses() {
  let added = 0;
  for (const course of STARTER_COURSES) {
    if (!(await Course.exists({ title: course.title }))) {
      await Course.create(course);
      added += 1;
    }
  }
  return added;
}

// Runs on server start. If the courses collection is completely empty (fresh
// MongoDB Atlas database) the starter courses are added, so students always
// have something to browse and enroll in. Turn off with AUTO_SEED_COURSES=false.
async function ensureStarterCourses() {
  if (process.env.AUTO_SEED_COURSES === "false") return 0;
  if ((await Course.estimatedDocumentCount()) > 0) return 0;
  const added = await seedMissingCourses();
  console.log(`Courses collection was empty: added ${added} starter courses.`);
  return added;
}

module.exports = { STARTER_COURSES, seedMissingCourses, ensureStarterCourses };
