const jwt = require("jsonwebtoken");
const authService = require("../services/authService");

async function register(req, res, next) {
  try {
    const student = await authService.registerStudent(req.body);

    return res.status(201).json({
      message: "Student registered successfully",
      student,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const student = await authService.loginStudent(req.body);

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

    const token = jwt.sign(
      { email: student.email },
      process.env.JWT_SECRET,
      {
        subject: String(student.id),
        expiresIn,
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      tokenType: "Bearer",
      expiresIn,
      student,
    });
  } catch (error) {
    next(error);
  }
}

// Protected: returns the student that owns the presented token.
async function me(req, res, next) {
  try {
    const student = authService.getStudentById(req.user.id);
    return res.status(200).json({ student });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  me,
};
