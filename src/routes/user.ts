import { UserController } from "@/controllers/user/user.controller";
import { authenticateToken } from "@/middleware/auth";
import { Router } from "express";

const userRouter = Router();

const userController = new UserController();

userRouter.use(authenticateToken);

userRouter.get(
  "/profile",
  userController.getProfile.bind(userController)
);

userRouter.put(
  "/profile",
  userController.updateProfile.bind(userController)
);
userRouter.put(
  "/password",
  userController.updatePassword.bind(userController)
);
userRouter.get(
  "/",
  userController.getAllUsers.bind(userController)
);
userRouter.get(
  "/:id",
  userController.getUserById.bind(userController)
);
userRouter.delete(
  "/:id",
  userController.deleteUser.bind(userController)
);

export { userRouter };
