const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/protect");
const router = express.Router();

// GET /api/users — admin gets all users
router.get("/", protect, async (req, res) => {
  const users = await User.find({}).select("-password");
  res.json(users);
});

// GET /api/users/team — manager gets their team
router.get("/team", protect, async (req, res) => {
  const team = await User.find({ managerId: req.user._id }).select("-password");
  res.json(team);
});

module.exports = router;