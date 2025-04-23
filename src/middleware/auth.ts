import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

export const authMiddleware = (
  req: Request & { user: string | jwt.JwtPayload },
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = jwt.verify(token, config.JWT_SECRET);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
