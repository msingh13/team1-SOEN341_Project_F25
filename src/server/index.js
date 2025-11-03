import express from "express";
import dotenv from "dotenv";
import eventRoutes from "./routes/event.js";
import adminAnalytics from "./routes/adminAnalytics.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("🚀 Backend is running and ready!");
});

// Routes
app.use("/api/events", eventRoutes);
app.use("/api", adminAnalytics);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
