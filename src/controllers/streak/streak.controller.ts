import { StreakRepository } from "@/repositories/streak.repository";
import { Request, Response } from "express";
import { asyncHandler } from "@/errors";
import {
  EmotionDataFetchFailedError,
  InvalidEmotionFiltersError,
} from "@/errors";
import Logger from "@/utils/logger";

export class StreakController {
  private streakRepository: StreakRepository;
  private readonly logger = new Logger(StreakController.name);

  constructor() {
    this.streakRepository = new StreakRepository();
  }

  getUserStreak = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    let streak;
    try {
      streak = await this.streakRepository.findByUserId(userId);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    if (!streak) {
      try {
        streak = await this.streakRepository.createStreak({
          userId,
          currentStreak: 0,
          longestStreak: 0,
          totalMoodTracked: 0,
        });
      } catch (error: any) {
        throw new EmotionDataFetchFailedError(
          `Не вдалося створити стрік: ${error.message}`
        );
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalMoodTracked: streak.totalMoodTracked,
        lastActivityDate: streak.lastActivityDate,
        streakStartDate: streak.streakStartDate,
        isActive: streak.isActive,
      },
    });
  });

  getTopStreaks = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (limit < 1 || limit > 100) {
      throw new InvalidEmotionFiltersError(["limit повинен бути між 1 та 100"]);
    }

    let topStreaks;
    try {
      topStreaks = await this.streakRepository.getTopStreaks(limit);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    return res.status(200).json({
      success: true,
      data: topStreaks,
      limit,
      count: topStreaks.length,
    });
  });

  resetUserStreak = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    let resetStreak;
    try {
      resetStreak = await this.streakRepository.resetStreak(userId);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    if (!resetStreak) {
      throw new EmotionDataFetchFailedError("Стрік користувача не знайдено");
    }

    return res.status(200).json({
      success: true,
      message: "Стрік користувача скинуто успішно",
      data: {
        currentStreak: resetStreak.currentStreak,
        longestStreak: resetStreak.longestStreak,
        totalMoodTracked: resetStreak.totalMoodTracked,
        isActive: resetStreak.isActive,
      },
    });
  });

  deleteUserStreak = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    let deletedStreak;
    try {
      deletedStreak = await this.streakRepository.deleteStreak(userId);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    if (!deletedStreak) {
      throw new EmotionDataFetchFailedError("Стрік користувача не знайдено");
    }

    return res.status(200).json({
      success: true,
      message: "Стрік користувача видалено успішно",
    });
  });

  getStreakStats = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    let streak;
    try {
      streak = await this.streakRepository.findByUserId(userId);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    if (!streak) {
      streak = await this.streakRepository.createStreak({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalMoodTracked: 0,
      });
    }

    const stats = {
      ...streak.toObject(),
      streakDuration:
        streak.streakStartDate && streak.lastActivityDate
          ? Math.floor(
              (new Date(streak.lastActivityDate).getTime() -
                new Date(streak.streakStartDate).getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1
          : 0,
      daysSinceLastActivity: streak.lastActivityDate
        ? Math.floor(
            (new Date().getTime() -
              new Date(streak.lastActivityDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
      averageEntriesPerDay:
        streak.totalMoodTracked && streak.streakStartDate
          ? (
              streak.totalMoodTracked /
              Math.max(
                1,
                Math.floor(
                  (new Date().getTime() -
                    new Date(streak.streakStartDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1
              )
            ).toFixed(2)
          : 0,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  });
}

