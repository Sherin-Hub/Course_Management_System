// In-memory course store, seeded with the same catalog the mock API used
// (ids c1..c6 must stay the same so existing enrollments still match).
const courses = [
  { id: "c1", title: "Python Programming", icon: "🐍", category: "Programming" },
  { id: "c2", title: "Modern Web Development", icon: "🌐", category: "Programming" },
  { id: "c3", title: "UI / UX Design Foundations", icon: "🎨", category: "Design" },
  { id: "c4", title: "Data Analysis with SQL", icon: "📊", category: "Data" },
  { id: "c5", title: "Machine Learning Basics", icon: "🤖", category: "Data" },
  { id: "c6", title: "Project Management Essentials", icon: "🗂️", category: "Business" },
];

module.exports = courses;
