require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();

const corsOptions = {
  origin: [
    "https://goalportal.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth",  require("./routes/auth"));
app.use("/api/goals", require("./routes/goals"));
app.use("/api/users", require("./routes/users"));
app.use("/api/ai",    require("./routes/ai"));

app.get("/", (req, res) => res.send("GoalQuest API running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));