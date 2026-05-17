require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, dept, managerId } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({ name, email, password, role, dept, managerId });
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept,
      managerId: user.managerId,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", require("../middleware/protect"), async (req, res) => {
  res.json(req.user);
});

module.exports = router;