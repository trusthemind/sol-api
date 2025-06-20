import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 2424,
  MONGODB_URL: process.env.MONGODB_URL || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  JWT_SECRET: process.env.JWT_SECRET || "default_secret",
};
