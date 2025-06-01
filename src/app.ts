import express from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";
import { errorHandler } from "./errors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(errorHandler);


app.use("/api/health", (_, res) => {
  res.status(200).json({ status: "OK", message: "Service is healthy" });
});


app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

export default app;
