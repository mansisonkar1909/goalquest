const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal" },
  action: { type: String, required: true },
  by:     { type: String, required: true },
  detail: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditSchema);