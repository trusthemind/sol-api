import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import AuthRoutes from "./routes/auth";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use("/api/health", (_, res) => {
  res.status(200).json({ status: "OK", message: "Service is healthy" });
});

app.use("/api/auth", AuthRoutes);

export default app;
