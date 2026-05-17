require("dotenv").config();
const express = require("express");
const Groq = require("groq-sdk");
const protect = require("../middleware/protect");
const Goal = require("../models/Goal");
const router = express.Router();

const openai = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── FEATURE 1: AI Goal Suggestions ──────────────────────────────────────────
router.post("/suggest-goals", protect, async (req, res) => {
  const { role, dept, thrustArea } = req.body;
  try {
    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an HR performance management expert. 
                    Suggest realistic measurable KPI goals for employees.
                    Always respond in valid JSON format only. No extra text.`
        },
        {
          role: "user",
          content: `Suggest 3 specific goals for:
                    Role: ${role}
                    Department: ${dept}
                    Thrust Area: ${thrustArea}
                    
                    Return only a JSON array like this:
                    [
                      {
                        "title": "Goal title here",
                        "description": "What success looks like",
                        "suggestedTarget": 100,
                        "uom": "Numeric (Min - Higher is better)",
                        "suggestedWeightage": 30,
                        "reasoning": "Why this goal matters"
                      }
                    ]`
        }
      ],
      max_tokens: 800,
    });

    const raw = completion.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const suggestions = JSON.parse(cleaned);
    res.json({ suggestions });
  } catch (err) {
    console.error("Suggest goals error:", err.message);
    res.status(500).json({ message: "AI suggestion failed", error: err.message });
  }
});

// ── FEATURE 2: AI Achievement Feedback ──────────────────────────────────────
router.post("/achievement-feedback", protect, async (req, res) => {
  const { goalTitle, target, uom, achievements, weightage } = req.body;
  try {
    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a supportive performance coach giving 
                    constructive feedback on employee KPI achievements.
                    Be specific, encouraging, and actionable.
                    Respond in valid JSON format only. No extra text.`
        },
        {
          role: "user",
          content: `Analyze this employee goal performance:
                    Goal: ${goalTitle}
                    Target: ${target}
                    Measurement: ${uom}
                    Weightage: ${weightage}%
                    
                    Quarterly achievements:
                    Q1: ${achievements.Q1 ?? "Not logged"}
                    Q2: ${achievements.Q2 ?? "Not logged"}
                    Q3: ${achievements.Q3 ?? "Not logged"}
                    Q4: ${achievements.Q4 ?? "Not logged"}
                    
                    Return only this JSON:
                    {
                      "overallRating": "Excellent/Good/Needs Improvement",
                      "trend": "Improving/Declining/Stable",
                      "feedback": "2-3 sentences of specific feedback",
                      "tips": ["tip 1", "tip 2", "tip 3"],
                      "predictedQ3": 123,
                      "riskLevel": "Low/Medium/High"
                    }`
        }
      ],
      max_tokens: 500,
    });

    const raw = completion.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const feedback = JSON.parse(cleaned);
    res.json({ feedback });
  } catch (err) {
    console.error("Feedback error:", err.message);
    res.status(500).json({ message: "AI feedback failed", error: err.message });
  }
});

// ── FEATURE 3: AI Chatbot ────────────────────────────────────────────────────
router.post("/chat", protect, async (req, res) => {
  const { message, history } = req.body;
  try {
    const goals = await Goal.find({ employeeId: req.user._id });
    const goalsContext = goals.length
      ? goals.map(g =>
          `- ${g.title} (${g.thrustArea}): Target ${g.target}, 
           Q1: ${g.achievements.Q1 ?? "N/A"}, 
           Q2: ${g.achievements.Q2 ?? "N/A"}, 
           Status: ${g.status}`
        ).join("\n")
      : "No goals set yet";

    const messages = [
      {
        role: "system",
        content: `You are GoalBot, a friendly AI assistant inside GoalQuest,
                  an employee performance management portal.
                  
                  Employee: ${req.user.name}
                  Role: ${req.user.role}
                  Department: ${req.user.dept}
                  
                  Their current goals:
                  ${goalsContext}
                  
                  Help them understand their performance, suggest improvements,
                  answer questions about goals and KPIs, and motivate them.
                  Keep responses concise, friendly, and under 100 words.`
      },
      ...(history || []),
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 300,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ message: "Chat failed", error: err.message });
  }
});

module.exports = router;