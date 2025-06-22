import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";
import { emotionRouter } from "./routes/emotion";
import { streakRouter } from "./routes/streak";

import { errorHandler } from "./errors";
import { adminRouter } from "./routes/admin";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://sol-web-app-gamma.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use("/api/health", (_, res) => {
  res.status(200).json({ status: "OK", message: "Service is healthy" });
});

app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/emotions", emotionRouter);
app.use("/api/streaks", streakRouter);

app.use(errorHandler);

export default app;
