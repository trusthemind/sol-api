import { UserController } from "@/controllers/user/user.controller";
import { asyncHandler } from "@/errors";
import { authenticateToken, requireAdmin } from "@/middleware/auth";
import { Router } from "express";

const adminRouter = Router();
const userController = new UserController();

adminRouter.get(
  "/users",
  asyncHandler(authenticateToken),
  asyncHandler(requireAdmin),
  userController.getAllUsers
);
adminRouter.get(
  "/users/:id",
  asyncHandler(authenticateToken),
  asyncHandler(requireAdmin),
  userController.getUserById
);
adminRouter.delete(
  "/users/:id",
  asyncHandler(authenticateToken),
  asyncHandler(requireAdmin),
  userController.deleteUser
);

export { adminRouter };
