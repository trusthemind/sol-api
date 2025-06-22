import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRepository } from "@/repositories/user.repository";
import Logger from "@/utils/logger";
import { UserRole } from "@/model/user.model";
import { config } from "@/config/env";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        iat?: number;
        exp?: number;
      };
    }
  }
}

interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

class AuthMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        return res.status(401).json({
          message: "Access token required",
          code: "TOKEN_MISSING",
        });
      }

      const decoded = this.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          message: "Invalid or expired token",
          code: "TOKEN_INVALID",
        });
      }

      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp,
      };

      next();
    } catch (error) {
      this.logger.error("Authentication error:", error);
      return res.status(401).json({
        message: "Authentication failed",
        code: "AUTH_ERROR",
      });
    }
  };

  public requireRole = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user)
        return res.status(401).json({
          message: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });

      if (!allowedRoles.includes(req.user.role))
        return res.status(403).json({
          message: "Insufficient permissions",
          code: "INSUFFICIENT_PERMISSIONS",
          required: allowedRoles,
          current: req.user.role,
        });

      next();
    };
  };

  public requireAdmin = this.requireRole([UserRole.ADMIN]);

  public requirePatient = this.requireRole([UserRole.PATIENT]);

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer "))
      return authHeader.substring(7);

    if (req.query.token && typeof req.query.token === "string")
      return req.query.token;

    if (req.cookies && req.cookies.token) return req.cookies.token;

    const customToken = req.headers["x-access-token"];
    if (customToken && typeof customToken === "string") return customToken;

    return null;
  }

  private verifyToken(token: string): JWTPayload | null {
    try {
      const jwtSecret = config.JWT_SECRET;
      if (!jwtSecret) return null;

      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      return error instanceof jwt.JsonWebTokenError ||
        error instanceof jwt.TokenExpiredError
        ? null
        : null;
    }
  }
}

const authMiddleware = new AuthMiddleware();

export const authenticateToken = authMiddleware.authenticateToken;
export const requireAdmin = authMiddleware.requireAdmin;
export const requirePatient = authMiddleware.requirePatient;

export default AuthMiddleware;
