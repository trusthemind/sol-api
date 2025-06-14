import { UserController } from "@/controllers/user/user.controller";
import { asyncHandler } from "@/errors";
import { authenticateToken } from "@/middleware/auth";
import { upload } from "@/middleware/upload";
import { Router } from "express";

const userRouter = Router();
const userController = new UserController();

userRouter.use(asyncHandler(authenticateToken));

userRouter.get("/profile", userController.getProfile.bind(userController));

userRouter.put("/profile", userController.updateProfile.bind(userController));

userRouter.put("/password", userController.updatePassword.bind(userController));

userRouter.post(
  "/avatar",
  upload.single("file"),
  userController.uploadAvatar.bind(userController)
);

userRouter.put(
  "/avatar",
  upload.single("file"),
  userController.uploadAvatar.bind(userController)
);

userRouter.delete("/avatar", userController.deleteAvatar.bind(userController));

userRouter.get("/", userController.getAllUsers.bind(userController));

userRouter.get("/:id", userController.getUserById.bind(userController));

userRouter.delete("/:id", userController.deleteUser.bind(userController));

export { userRouter };
