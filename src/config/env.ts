import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "default_secret"
};
