import jwt from "jsonwebtoken";
import { config } from "../config/env";

export const generateToken = (payload: object) =>
  jwt.sign(payload, config.JWT_SECRET, { expiresIn: "1h" });

export const verifyToken = (token: string) =>
  jwt.verify(token, config.JWT_SECRET);
