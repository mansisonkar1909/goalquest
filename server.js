require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use("/api/auth",  require("./routes/auth"));
app.use("/api/goals", require("./routes/goals"));
app.use("/api/users", require("./routes/users"));
app.use("/api/ai",    require("./routes/ai"));

app.get("/", (req, res) => res.send("GoalQuest API running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));