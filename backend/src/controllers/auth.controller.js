const { registerUserAndOrganization, loginUser, getCurrentUser, z } = require("../services/auth.service");

async function register(req, res) {
  try {
    const data = await registerUserAndOrganization(req.body);
    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0]?.message || "Invalid input" });
    }
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function login(req, res) {
  try {
    const data = await loginUser(req.body);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0]?.message || "Invalid input" });
    }
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function me(req, res) {
  try {
    const user = await getCurrentUser(req.user.userId);
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

module.exports = {
  register,
  login,
  me,
};
