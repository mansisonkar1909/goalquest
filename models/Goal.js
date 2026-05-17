const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  employeeId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  thrustArea:  { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String },
  uom:         { type: String, required: true },
  target:      { type: Number, required: true },
  weightage:   { type: Number, required: true, min: 10 },
  status:      { type: String, enum: ["Draft","Pending Approval","Approved","Rejected"], default: "Pending Approval" },
  locked:      { type: Boolean, default: false },
  isShared:    { type: Boolean, default: false },
  sharedFrom:  { type: String, default: null },
  achievements: {
    Q1: { type: Number, default: null },
    Q2: { type: Number, default: null },
    Q3: { type: Number, default: null },
    Q4: { type: Number, default: null },
  },
  checkInComments: {
    Q1: { text: String, by: String, at: Date },
    Q2: { text: String, by: String, at: Date },
    Q3: { text: String, by: String, at: Date },
    Q4: { text: String, by: String, at: Date },
  },
  managerRemarks: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Goal", goalSchema);