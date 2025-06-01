import { AuthController } from "@/controllers/user/auth.controller";
import { authenticateToken } from "@/middleware/auth";
import { Router } from "express";

const authRouter = Router();

const authController = new AuthController();

authRouter.post("/registration", authController.register.bind(authController));

authRouter.post("/login", authController.login.bind(authController));

authRouter.post(
  "/refresh-token",
  authenticateToken,
  authController.refreshToken.bind(authController)
);
authRouter.post(
  "/logout",
  authenticateToken,
  authController.logout.bind(authController)
);

export { authRouter };
