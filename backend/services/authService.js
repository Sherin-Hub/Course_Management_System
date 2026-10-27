const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const students = require("../data/students");

function publicStudent(student) {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    department: student.department,
    ...(student.phone ? { phone: student.phone } : {}),
    role: "student",
    createdAt: student.createdAt,
  };
}

async function registerStudent({ name, email, password, department, phone }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingStudent = students.find(
    (student) => student.email === normalizedEmail
  );

  if (existingStudent) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const student = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    department: department.trim(),
    phone: typeof phone === "string" ? phone.trim() : "",
    createdAt: new Date().toISOString(),
  };

  students.push(student);

  return publicStudent(student);
}

async function loginStudent({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const student = students.find((item) => item.email === normalizedEmail);

  if (!student) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, student.passwordHash);

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return publicStudent(student);
}

// Used by GET /auth/me so the frontend can restore a session from a token.
function getStudentById(id) {
  const student = students.find((item) => item.id === id);
  if (!student) {
    const error = new Error("Student account no longer exists");
    error.statusCode = 401;
    throw error;
  }
  return publicStudent(student);
}

module.exports = {
  registerStudent,
  loginStudent,
  getStudentById,
};
