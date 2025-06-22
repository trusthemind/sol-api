import {
  EmotionFilters,
  EmotionRepository,
} from "@/repositories/emotional.repository";
import { StreakRepository } from "@/repositories/streak.repository";
import { Request, Response } from "express";
import { asyncHandler, EmotionSearchFailedError } from "@/errors";
import {
  EmotionNotFoundError,
  EmotionCreationFailedError,
  EmotionUpdateFailedError,
  EmotionDeletionFailedError,
  InvalidEmotionDataError,
  InvalidTimeRangeError,
  EmotionEnrichmentFailedError,
  InvalidEmotionFiltersError,
  EmotionDataFetchFailedError,
  IntensityConversionError,
} from "@/errors";
import { EmotionUtils } from "@/utils/emotionConverter";
import Logger from "@/utils/logger";

export class EmotionController {
  private emotionRepository: EmotionRepository;
  private streakRepository: StreakRepository;
  private readonly logger = new Logger(EmotionController.name);

  constructor() {
    this.emotionRepository = new EmotionRepository();
    this.streakRepository = new StreakRepository();
  }

  createEmotion = asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      emotion,
      intensity = 5,
      description,
      triggers,
      tags,
      stressLevel,
      activities,
    } = req.body;

    if (!userId || !emotion) {
      throw new InvalidEmotionDataError(
        "userId та emotion є обов'язковими полями"
      );
    }

    if (!EmotionUtils.isValidEmotion(emotion)) {
      throw new InvalidEmotionDataError(`Невірна емоція: ${emotion}`);
    }

    const normalizedIntensity = EmotionUtils.normalizeIntensity(intensity);
    const normalizedStressLevel = stressLevel
      ? EmotionUtils.normalizeIntensity(stressLevel)
      : undefined;

    const emotionData = {
      userId,
      emotion: EmotionUtils.toEnglish(emotion),
      intensity: normalizedIntensity,
      description,
      triggers,
      tags,
      stressLevel: normalizedStressLevel,
      activities,
    };

    let createdEmotion;
    try {
      createdEmotion = await this.emotionRepository.create(emotionData);
    } catch (error: any) {
      throw new EmotionCreationFailedError(error.message);
    }

    let streak;
    try {
      await this.updateUserStreak(userId);
      streak = await this.streakRepository.findByUserId(userId);
    } catch (error: any) {
      this.logger.warn("Failed to update streak:", error);
    }

    const enrichedEmotion = createdEmotion.toObject
      ? createdEmotion.toObject()
      : createdEmotion;

    return res.status(201).json({
      success: true,
      message: "Запис емоції створено успішно",
      data: {
        emotion: enrichedEmotion,
        streak: streak
          ? {
              currentStreak: streak.currentStreak,
              longestStreak: streak.longestStreak,
              totalMoodTracked: streak.totalMoodTracked,
            }
          : null,
      },
    });
  });

  getAllEmotions = asyncHandler(async (req: Request, res: Response) => {
    const filters: EmotionFilters = {
      userId: req.query.userId as string,
      emotion: req.query.emotion as any,
      intensity: req.query.intensity ? Number(req.query.intensity) : undefined,
      timeRange: req.query.timeRange as any,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      skip: req.query.skip ? Number(req.query.skip) : 0,
      sortBy: (req.query.sortBy as any) || "createdAt",
      sortOrder: (req.query.sortOrder as any) || "desc",
    };

    // Валідація intensity якщо передана
    if (
      filters.intensity &&
      !EmotionUtils.validateIntensity(filters.intensity)
    ) {
      throw new InvalidEmotionFiltersError([
        "intensity повинен бути між 1 та 10",
      ]);
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
      throw new InvalidEmotionFiltersError(["limit повинен бути між 1 та 100"]);
    }

    let emotions, total, streak;
    try {
      [emotions, total, streak] = await Promise.all([
        this.emotionRepository.findAll(filters),
        this.emotionRepository.count(filters),
        filters.userId
          ? this.streakRepository.findByUserId(filters.userId)
          : null,
      ]);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    const enrichedEmotions = emotions.map((emotion) =>
      emotion.toObject ? emotion.toObject() : emotion
    );

    return res.status(200).json({
      success: true,
      data: enrichedEmotions,
      total,
      filters,
      streak: streak
        ? {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            totalMoodTracked: streak.totalMoodTracked,
          }
        : null,
    });
  });

  getEmotionById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    let emotion;
    try {
      emotion = await this.emotionRepository.findById(id);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    if (!emotion) {
      throw new EmotionNotFoundError(id);
    }

    const enrichedEmotion = emotion.toObject ? emotion.toObject() : emotion;

    return res.status(200).json({
      success: true,
      data: enrichedEmotion,
    });
  });

  updateEmotion = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new InvalidEmotionDataError("Дані для оновлення не надано");
    }

    // Обробка emotion
    if (
      updateData.emotion &&
      !EmotionUtils.isValidEmotion(updateData.emotion)
    ) {
      throw new InvalidEmotionDataError(
        `Невірна емоція: ${updateData.emotion}`
      );
    }

    // Обробка intensity
    if (updateData.intensity !== undefined) {
      const normalizedIntensity = EmotionUtils.normalizeIntensity(
        updateData.intensity
      );
      if (!EmotionUtils.validateIntensity(normalizedIntensity)) {
        throw new IntensityConversionError(
          `Intensity повинен бути між 1 та 10: ${updateData.intensity}`
        );
      }
      updateData.intensity = normalizedIntensity;
    }

    // Обробка stressLevel
    if (updateData.stressLevel !== undefined) {
      const normalizedStressLevel = EmotionUtils.normalizeIntensity(
        updateData.stressLevel
      );
      if (!EmotionUtils.validateIntensity(normalizedStressLevel)) {
        throw new IntensityConversionError(
          `StressLevel повинен бути між 1 та 10: ${updateData.stressLevel}`
        );
      }
      updateData.stressLevel = normalizedStressLevel;
    }

    let emotion;
    try {
      emotion = await this.emotionRepository.update(id, updateData);
    } catch (error: any) {
      throw new EmotionUpdateFailedError(error.message);
    }

    if (!emotion) {
      throw new EmotionNotFoundError(id);
    }

    const enrichedEmotion = emotion.toObject ? emotion.toObject() : emotion;

    return res.status(200).json({
      success: true,
      message: "Запис емоції оновлено успішно",
      data: enrichedEmotion,
    });
  });

  deleteEmotion = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    let emotion;
    try {
      emotion = await this.emotionRepository.delete(id);
    } catch (error: any) {
      throw new EmotionDeletionFailedError(error.message);
    }

    if (!emotion) {
      throw new EmotionNotFoundError(id);
    }

    return res.status(200).json({
      success: true,
      message: "Запис емоції видалено успішно",
    });
  });

  getEmotionsByTimeRange = asyncHandler(async (req: Request, res: Response) => {
    const { userId, timeRange } = req.params;

    const validTimeRanges = ["today", "week", "month", "quarter", "year"];
    if (!validTimeRanges.includes(timeRange)) {
      throw new InvalidTimeRangeError(timeRange);
    }

    let emotions;
    try {
      emotions = await this.emotionRepository.findByTimeRange(
        userId,
        timeRange
      );
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    const enrichedEmotions = emotions.map((emotion) =>
      emotion.toObject ? emotion.toObject() : emotion
    );

    return res.status(200).json({
      success: true,
      data: enrichedEmotions,
      timeRange,
      count: emotions.length,
    });
  });

  searchEmotions = asyncHandler(async (req: Request, res: Response) => {
    const filters: EmotionFilters = {
      userId: req.query.userId as string,
      emotion: req.query.emotions
        ? ((req.query.emotions as string).split(",") as any)
        : undefined,
      intensity: req.query.intensity ? Number(req.query.intensity) : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
      triggers: req.query.triggers
        ? (req.query.triggers as string).split(",")
        : undefined,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    };

    if (!filters.userId)
      throw new InvalidEmotionFiltersError([
        "userId є обов'язковим для пошуку",
      ]);

    // Валідація intensity
    if (
      filters.intensity &&
      !EmotionUtils.validateIntensity(filters.intensity)
    ) {
      throw new InvalidEmotionFiltersError([
        "intensity повинен бути між 1 та 10",
      ]);
    }

    let emotions, total;
    try {
      [emotions, total] = await Promise.all([
        this.emotionRepository.findAll(filters),
        this.emotionRepository.count(filters),
      ]);
    } catch (error: any) {
      throw new EmotionSearchFailedError(error.message);
    }

    const enrichedEmotions = emotions.map((emotion) =>
      emotion.toObject ? emotion.toObject() : emotion
    );

    return res.status(200).json({
      success: true,
      data: enrichedEmotions,
      total,
      filters,
    });
  });

  // Новий метод для отримання стріка користувача
  getUserStreak = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    let streak;
    try {
      streak = await this.streakRepository.findByUserId(userId);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    if (!streak) {
      // Створюємо початковий стрік якщо не існує
      streak = await this.streakRepository.createStreak({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalMoodTracked: 0,
      });
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

  // Метод для оновлення стріка (приватний)
  private async updateUserStreak(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streak = await this.streakRepository.findByUserId(userId);

    if (!streak) {
      await this.streakRepository.createStreak({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        streakStartDate: today,
        lastActivityDate: today,
        totalMoodTracked: 1,
      });
      return;
    }

    const lastActivity = new Date(streak.lastActivityDate || new Date(0));
    lastActivity.setHours(0, 0, 0, 0);

    if (lastActivity.getTime() === today.getTime()) {
      // Вже записували сьогодні - тільки збільшуємо лічильник
      await this.streakRepository.incrementMoodCount(userId);
    } else if (lastActivity.getTime() === yesterday.getTime()) {
      // Вчора був запис - продовжуємо стрік
      const newCurrentStreak = streak.currentStreak + 1;
      const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);

      await this.streakRepository.updateStreak(userId, {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: today,
        totalMoodTracked: streak.totalMoodTracked + 1,
        isActive: true,
      });
    } else {
      // Пропуск - починаємо новий стрік
      await this.streakRepository.updateStreak(userId, {
        currentStreak: 1,
        streakStartDate: today,
        lastActivityDate: today,
        totalMoodTracked: streak.totalMoodTracked + 1,
        isActive: true,
      });
    }
  }
}
