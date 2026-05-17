const express = require("express");
const Goal = require("../models/Goal");
const AuditLog = require("../models/AuditLog");
const protect = require("../middleware/protect");
const router = express.Router();

// GET /api/goals — get my goals
router.get("/", protect, async (req, res) => {
  const goals = await Goal.find({ employeeId: req.user._id });
  res.json(goals);
});

// GET /api/goals/team — manager gets team goals
router.get("/team", protect, async (req, res) => {
  const { User } = require("../models/User");
  const teamMembers = await require("../models/User").find({ managerId: req.user._id });
  const ids = teamMembers.map(u => u._id);
  const goals = await Goal.find({ employeeId: { $in: ids } }).populate("employeeId","name dept");
  res.json(goals);
});

// GET /api/goals/all — admin gets all goals
router.get("/all", protect, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const goals = await Goal.find({}).populate("employeeId","name dept");
  res.json(goals);
});

// POST /api/goals — create new goal
router.post("/", protect, async (req, res) => {
  try {
    // check total weightage won't exceed 100
    const existing = await Goal.find({ employeeId: req.user._id });
    const totalWeight = existing.reduce((s, g) => s + g.weightage, 0);
    if (totalWeight + req.body.weightage > 100) {
      return res.status(400).json({ message: "Total weightage cannot exceed 100%" });
    }
    if (existing.length >= 8) {
      return res.status(400).json({ message: "Maximum 8 goals allowed" });
    }
    const goal = await Goal.create({ ...req.body, employeeId: req.user._id });
    await AuditLog.create({ goalId: goal._id, action: "Goal Created", by: req.user.name, detail: `Target: ${goal.target}` });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/goals/:id/approve — manager approves
router.put("/:id/approve", protect, async (req, res) => {
  const goal = await Goal.findByIdAndUpdate(
    req.params.id,
    { status: "Approved", locked: true, managerRemarks: req.body.remarks },
    { new: true }
  );
  await AuditLog.create({ goalId: goal._id, action: "Goal Approved", by: req.user.name, detail: "Locked by manager" });
  res.json(goal);
});

// PUT /api/goals/:id/reject — manager rejects
router.put("/:id/reject", protect, async (req, res) => {
  const goal = await Goal.findByIdAndUpdate(
    req.params.id,
    { status: "Rejected", managerRemarks: req.body.remarks },
    { new: true }
  );
  await AuditLog.create({ goalId: goal._id, action: "Goal Rejected", by: req.user.name, detail: req.body.remarks });
  res.json(goal);
});

// PUT /api/goals/:id/achievement — log quarterly actual
router.put("/:id/achievement", protect, async (req, res) => {
  const { quarter, value } = req.body;
  const goal = await Goal.findByIdAndUpdate(
    req.params.id,
    { [`achievements.${quarter}`]: value },
    { new: true }
  );
  await AuditLog.create({ goalId: goal._id, action: `Achievement Logged`, by: req.user.name, detail: `${quarter}: ${value}` });
  res.json(goal);
});

// PUT /api/goals/:id/checkin — manager adds check-in comment
router.put("/:id/checkin", protect, async (req, res) => {
  const { quarter, comment } = req.body;
  const goal = await Goal.findByIdAndUpdate(
    req.params.id,
    { [`checkInComments.${quarter}`]: { text: comment, by: req.user.name, at: new Date() } },
    { new: true }
  );
  await AuditLog.create({ goalId: goal._id, action: "Check-in Added", by: req.user.name, detail: comment });
  res.json(goal);
});

// DELETE /api/goals/:id
router.delete("/:id", protect, async (req, res) => {
  await Goal.findByIdAndDelete(req.params.id);
  res.json({ message: "Goal deleted" });
});

module.exports = router;