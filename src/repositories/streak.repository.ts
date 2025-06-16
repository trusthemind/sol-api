import { IStreak, Streak } from "@/model/streak.model";
import Logger from "@/utils/logger";
import {
  DatabaseQueryError,
  DatabaseConnectionError,
  UserCreationFailedError,
  UserUpdateFailedError,
  UserDeletionFailedError,
} from "@/errors";

export class StreakRepository {
  private readonly logger = new Logger(StreakRepository.name);

  async findByUserId(userId: string): Promise<IStreak | null> {
    try {
      return await Streak.findOne({ userId }).lean();
    } catch (error) {
      this.logger.error("Error finding streak by userId:", error);
      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }
      throw new DatabaseQueryError(
        "findByUserId",
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async createStreak(streakData: {
    userId: string;
    currentStreak?: number;
    longestStreak?: number;
    streakStartDate?: Date;
    lastActivityDate?: Date;
    totalMoodTracked?: number;
  }): Promise<IStreak> {
    try {
      const streak = new Streak(streakData);
      return await streak.save();
    } catch (error) {
      this.logger.error("Error creating streak:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new UserCreationFailedError(
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async updateStreak(
    userId: string,
    updateData: Partial<IStreak>
  ): Promise<IStreak | null> {
    try {
      return await Streak.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, runValidators: true, upsert: true }
      ).lean();
    } catch (error) {
      this.logger.error("Error updating streak:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new UserUpdateFailedError(
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async incrementMoodCount(userId: string): Promise<IStreak | null> {
    try {
      return await Streak.findOneAndUpdate(
        { userId },
        { $inc: { totalMoodTracked: 1 } },
        { new: true, upsert: true }
      ).lean();
    } catch (error) {
      this.logger.error("Error incrementing mood count:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new UserUpdateFailedError("Failed to increment mood count");
    }
  }

  async updateStreakActivity(
    userId: string,
    activityDate: Date
  ): Promise<IStreak | null> {
    try {
      return await Streak.findOneAndUpdate(
        { userId },
        { 
          $set: { lastActivityDate: activityDate },
          $inc: { totalMoodTracked: 1 }
        },
        { new: true, upsert: true }
      ).lean();
    } catch (error) {
      this.logger.error("Error updating streak activity:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new UserUpdateFailedError("Failed to update streak activity");
    }
  }

  async findActiveStreaks(): Promise<IStreak[]> {
    try {
      return await Streak.find({ isActive: true }).lean();
    } catch (error) {
      this.logger.error("Error finding active streaks:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new DatabaseQueryError(
        "findActiveStreaks",
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async resetStreak(userId: string): Promise<IStreak | null> {
    try {
      return await Streak.findOneAndUpdate(
        { userId },
        { 
          $set: { 
            currentStreak: 0,
            isActive: false,
            streakStartDate: null
          }
        },
        { new: true }
      ).lean();
    } catch (error) {
      this.logger.error("Error resetting streak:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new UserUpdateFailedError("Failed to reset streak");
    }
  }

  async getTopStreaks(limit: number = 10): Promise<IStreak[]> {
    try {
      return await Streak.find({ isActive: true })
        .sort({ currentStreak: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName')
        .lean();
    } catch (error) {
      this.logger.error("Error getting top streaks:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new DatabaseQueryError(
        "getTopStreaks",
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async deleteStreak(userId: string): Promise<IStreak | null> {
    try {
      return await Streak.findOneAndDelete({ userId }).lean();
    } catch (error) {
      this.logger.error("Error deleting streak:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new UserDeletionFailedError(
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async streakExists(userId: string): Promise<boolean> {
    try {
      const streak = await Streak.findOne({ userId }).select("_id").lean();
      return !!streak;
    } catch (error) {
      this.logger.error("Error checking if streak exists:", error);

      if (this.isDatabaseConnectionError(error)) {
        throw new DatabaseConnectionError();
      }

      throw new DatabaseQueryError(
        "streakExists",
        error instanceof Error ? error.message : undefined
      );
    }
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