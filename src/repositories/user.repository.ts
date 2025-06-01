import { IUser, User } from "@/model/user/user.model";
import Logger from "@/utils/logger";
import {
  DatabaseQueryError,
  DuplicateKeyError,
  DatabaseConnectionError,
  UserCreationFailedError,
  UserUpdateFailedError,
  UserDeletionFailedError,
} from "@/errors";

export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email }).lean();
    } catch (error) {
      this.logger.error("Error finding user by email:", error);
      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }
      throw new DatabaseQueryError(
        "findByEmail",
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async findById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id).lean();
    } catch (error) {
      this.logger.error("Error finding user by ID:", error);
      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }
      throw new DatabaseQueryError(
        "findById",
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async createUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    avatar?: string;
  }): Promise<IUser> {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      this.logger.error("Error creating user:", error);

      if (this.isDuplicateKeyError(error)) {
        throw new DuplicateKeyError("email");
      }

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new UserCreationFailedError(
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async updateUser(
    id: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      this.logger.error("Error updating user:", error);

      if (this.isDuplicateKeyError(error)) {
        throw new DuplicateKeyError("email");
      }

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new UserUpdateFailedError(
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async deleteUser(id: string): Promise<IUser | null> {
    try {
      return await User.findByIdAndDelete(id).lean();
    } catch (error) {
      this.logger.error("Error deleting user:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new UserDeletionFailedError(
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async findUsers(
    filters: any = {},
    page: number = 1,
    limit: number = 10
  ): Promise<IUser[]> {
    try {
      const skip = (page - 1) * limit;
      return await User.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (error) {
      this.logger.error("Error finding users:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new DatabaseQueryError(
        "findUsers",
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async countUsers(filters: any = {}): Promise<number> {
    try {
      return await User.countDocuments(filters);
    } catch (error) {
      this.logger.error("Error counting users:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new DatabaseQueryError(
        "countUsers",
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async findUsersByRole(role: string): Promise<IUser[]> {
    try {
      return await User.find({ role }).lean();
    } catch (error) {
      this.logger.error("Error finding users by role:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new DatabaseQueryError(
        "findUsersByRole",
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async userExists(id: string): Promise<boolean> {
    try {
      const user = await User.findById(id).select("_id").lean();
      return !!user;
    } catch (error) {
      this.logger.error("Error checking if user exists:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new DatabaseQueryError(
        "userExists",
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async updateHealthId(
    userId: string,
    healthId: string
  ): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { healthId },
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      this.logger.error("Error updating health ID:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new UserUpdateFailedError("Failed to update health ID");
    }
  }

  private isDuplicateKeyError(error: any): boolean {
    return (
      error instanceof Error &&
      typeof (error as any).code === "number" &&
      (error as any).code === 11000
    );
  }

  private isDatabaseConnectionError(error: any): boolean {
    if (!(error instanceof Error)) return false;

    const connectionErrorMessages = [
      "connection",
      "timeout",
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      "network",
    ];

    return connectionErrorMessages.some((msg) =>
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }
}
