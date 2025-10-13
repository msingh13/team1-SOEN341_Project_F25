import express from "express";
import dotenv from "dotenv";
import eventRoutes from "./routes/event.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 Backend is running and ready!");
});

app.use("/", eventRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
