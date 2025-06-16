import { Request, Response, NextFunction } from "express";
import { hashPassword, comparePasswords } from "@/utils/hash";
import Logger from "@/utils/logger";
import { UserRepository } from "@/repositories/user.repository";
import { UserRole } from "@/model/user.model";
import {
  UserNotFoundError,
  InvalidCurrentPasswordError,
  InsufficientPermissionsError,
  UnauthorizedError,
  ProfileUpdateFailedError,
  PasswordUpdateFailedError,
  UserDeletionFailedError,
  InternalServerError,
  asyncHandler,
} from "@/errors";
import { AvatarService } from "@/services/avatar.service";

export class UserController {
  private readonly logger = new Logger(UserController.name);
  private readonly avatarService = new AvatarService();
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public getProfile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;

      if (!userId) throw new UnauthorizedError("User ID not found in request");

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundError(`ID: ${userId}`);
      }

      return res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phoneNumber,
          role: user.role,
          avatar: user.avatar,
          healthId: user.healthId,
          sinceForm: user.createdAt,
        },
      });
    }
  );

  public updateProfile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError("User ID not found in request");
      }

      const { firstName, lastName, email, avatar, phone } = req.body;

      try {
        const updateData:
          | {
              firstName: string;
              lastName: string;
              avatar: string;
              phoneNumber: string;
              email: string;
            }
          | any = {};
        if (email) updateData.email = email;
        if (firstName) updateData.firstName = firstName?.trim();
        if (lastName) updateData.lastName = lastName?.trim();
        if (avatar) updateData.avatar = avatar;
        if (phone) updateData.phoneNumber = phone;

        const updatedUser = await this.userRepository.updateUser(
          userId,
          updateData
        );
        if (!updatedUser) {
          throw new UserNotFoundError(`ID: ${userId}`);
        }

        this.logger.info(`User profile updated: ${userId}`);

        return res.status(200).json({
          message: "Profile updated successfully",
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phone: updatedUser.phoneNumber,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
          },
        });
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          throw error;
        }
        this.logger.error("Update profile error:", error);
        throw new ProfileUpdateFailedError(
          error instanceof Error ? error.message : undefined
        );
      }
    }
  );

  public updatePassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError("User ID not found in request");
      }

      const { currentPassword, newPassword } = req.body;

      try {
        const user = await this.userRepository.findById(userId);
        if (!user) {
          throw new UserNotFoundError(`ID: ${userId}`);
        }

        const isValidPassword = await comparePasswords(
          currentPassword,
          user.password
        );
        if (!isValidPassword) {
          throw new InvalidCurrentPasswordError();
        }

        const hashedNewPassword = await hashPassword(newPassword);

        await this.userRepository.updateUser(userId, {
          password: hashedNewPassword,
        });

        this.logger.info(`User password updated: ${userId}`);

        return res.status(200).json({
          message: "Password updated successfully",
        });
      } catch (error) {
        if (
          error instanceof UserNotFoundError ||
          error instanceof InvalidCurrentPasswordError
        ) {
          throw error;
        }
        this.logger.error("Update password error:", error);
        throw new PasswordUpdateFailedError(
          error instanceof Error ? error.message : undefined
        );
      }
    }
  );

  public getUserById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const requestingUser = req.user;

      if (!requestingUser) {
        throw new UnauthorizedError();
      }

      // Check if user has permission to view other users
      if (requestingUser.role !== UserRole.DOCTOR && requestingUser.id !== id) {
        throw new InsufficientPermissionsError(
          [UserRole.DOCTOR],
          requestingUser.role
        );
      }

      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new UserNotFoundError(`ID: ${id}`);
      }

      return res.status(200).json({
        message: "User retrieved successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          healthId: user.healthId,
        },
      });
    }
  );

  public getAllUsers = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const requestingUser = req.user;

      if (!requestingUser) {
        throw new UnauthorizedError();
      }

      // Check if user has permission to view all users
      if (requestingUser.role !== UserRole.DOCTOR) {
        throw new InsufficientPermissionsError(
          [UserRole.DOCTOR],
          requestingUser.role
        );
      }

      try {
        const { page = 1, limit = 10, role, search } = req.query;

        const filters: any = {};
        if (role && Object.values(UserRole).includes(role as UserRole)) {
          filters.role = role;
        }
        if (search) {
          filters.$or = [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ];
        }

        const users = await this.userRepository.findUsers(
          filters,
          parseInt(page as string),
          parseInt(limit as string)
        );

        const total = await this.userRepository.countUsers(filters);

        return res.status(200).json({
          message: "Users retrieved successfully",
          users: users.map((user) => ({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar,
          })),
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        });
      } catch (error) {
        this.logger.error("Get all users error:", error);
        throw new InternalServerError("Failed to retrieve users");
      }
    }
  );

  public deleteUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const requestingUser = req.user;

      if (!requestingUser) {
        throw new UnauthorizedError();
      }

      if (requestingUser.role !== UserRole.DOCTOR && requestingUser.id !== id) {
        throw new InsufficientPermissionsError(
          [UserRole.DOCTOR],
          requestingUser.role
        );
      }

      try {
        const deletedUser = await this.userRepository.deleteUser(id);
        if (!deletedUser) {
          throw new UserNotFoundError(`ID: ${id}`);
        }

        this.logger.info(`User deleted: ${id} by ${requestingUser.id}`);

        return res.status(200).json({
          message: "User deleted successfully",
        });
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          throw error;
        }
        this.logger.error("Delete user error:", error);
        throw new UserDeletionFailedError(
          error instanceof Error ? error.message : undefined
        );
      }
    }
  );

  public uploadAvatar = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError("User ID not found in request");
      }

      const file = (req as any).files?.file || req.file;
      if (!file) {
        return res.status(400).json({
          message: "No avatar file provided",
        });
      }

      try {
        const avatarUrl = await this.avatarService.uploadAvatar(
          Array.isArray(file) ? file[0] : file,
          userId
        );

        const updatedUser = await this.userRepository.updateUser(userId, {
          avatar: avatarUrl,
        });

        if (!updatedUser) throw new UserNotFoundError(`ID: ${userId}`);

        this.logger.info(`Avatar uploaded for user: ${userId}`);

        return res.status(200).json({
          message: "Avatar uploaded successfully",
          avatar: avatarUrl,
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
          },
        });
      } catch (error) {
        this.logger.error("Avatar upload error:", error);
        throw new ProfileUpdateFailedError(
          error instanceof Error ? error.message : "Avatar upload failed"
        );
      }
    }
  );

  public deleteAvatar = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User ID not found in request");

      try {
        await this.avatarService.deleteAvatar(userId);

        const updatedUser = await this.userRepository.updateUser(userId, {
          avatar: undefined,
        });

        if (!updatedUser) {
          throw new UserNotFoundError(`ID: ${userId}`);
        }

        this.logger.info(`Avatar deleted for user: ${userId}`);

        return res.status(200).json({
          message: "Avatar deleted successfully",
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
          },
        });
      } catch (error) {
        this.logger.error("Avatar deletion error:", error);
        throw new ProfileUpdateFailedError(
          error instanceof Error ? error.message : "Avatar deletion failed"
        );
      }
    }
  );
}
