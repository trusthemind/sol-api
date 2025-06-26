import {
  EmotionFilters,
  EmotionRepository,
} from "@/repositories/emotional.repository";
import { StreakRepository } from "@/repositories/streak.repository";
import { OpenAIService } from "@/services/openai.service";
import { Request, Response } from "express";
import { asyncHandler } from "@/errors";
import {
  SummaryGenerationFailedError,
  EmotionDataFetchFailedError,
  OpenAIServiceError,
  InvalidEmotionDataError,
} from "@/errors";
import { EmotionType, IEmotionEntry } from "@/model/emotional.model";
import Logger from "@/utils/logger";
import { EmotionUtils } from "@/utils/emotionConverter";

export class EmotionAIController {
  private emotionRepository: EmotionRepository;
  private streakRepository: StreakRepository;
  private openAIService: OpenAIService;
  private readonly logger = new Logger(EmotionAIController.name);

  constructor() {
    this.emotionRepository = new EmotionRepository();
    this.streakRepository = new StreakRepository();
    this.openAIService = new OpenAIService();
  }

  getEmotionAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { timeRange = "month" } = req.query;

    let emotions, stats, patterns;
    try {
      [emotions, stats, patterns] = await Promise.all([
        this.emotionRepository.findByTimeRange(userId, timeRange as string),
        this.emotionRepository.getEmotionStats(userId, {
          timeRange: timeRange as any,
        }),
        this.emotionRepository.getEmotionPatterns(userId, 30),
      ]);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    let analysis;
    try {
      analysis = await this.openAIService.analyzeEmotions(
        emotions,
        stats,
        patterns
      );
    } catch (error: any) {
      throw new OpenAIServiceError("аналіз емоцій", error.message);
    }

    this.logger.info("Asdasd", stats);
    return res.status(200).json({
      success: true,
      data: {
        analysis,
        summary: {
          totalEntries: stats.totalEntries,
          averageIntensity: stats.averageIntensity,
          mostCommonIntensity: stats.mostCommonIntensity,
          mostCommonEmotion: stats.mostCommonEmotion,
          timeRange,
        },
      },
    });
  });

  getRecommendations = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { timeRange = "week" } = req.query;

    let emotions, stats;
    try {
      [emotions, stats] = await Promise.all([
        this.emotionRepository.findByTimeRange(userId, timeRange as string),
        this.emotionRepository.getEmotionStats(userId, {
          timeRange: timeRange as any,
        }),
      ]);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    let recommendations;
    try {
      recommendations = await this.openAIService.generateRecommendations(
        emotions,
        stats
      );
    } catch (error: any) {
      throw new OpenAIServiceError("генерація рекомендацій", error.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        recommendations,
        basedOn: {
          entriesAnalyzed: emotions.length,
          timeRange,
          averageIntensity: stats.averageIntensity,
          mostCommonIntensity: stats.mostCommonIntensity,
          dominantEmotion: stats.mostCommonEmotion,
        },
      },
    });
  });

  generateInstantRecommendation = asyncHandler(
    async (req: Request, res: Response) => {
      const {
        emotion,
        intensity,
        triggers = [],
        notes = "",
        tags = [],
      } = req.body;

      if (!emotion || intensity === undefined) {
        throw new InvalidEmotionDataError(
          "emotion та intensity є обов'язковими полями"
        );
      }

      // Валідація емоції
      if (!EmotionUtils.isValidEmotion(emotion)) {
        throw new InvalidEmotionDataError(`Невірна емоція: ${emotion}`);
      }

      // Валідація та нормалізація intensity
      const normalizedIntensity = EmotionUtils.normalizeIntensity(intensity);
      if (!EmotionUtils.validateIntensity(normalizedIntensity)) {
        throw new InvalidEmotionDataError(
          `Intensity повинен бути між 1 та 10: ${intensity}`
        );
      }

      const fakeEntry: Partial<IEmotionEntry> = {
        emotion: EmotionUtils.toEnglish(emotion) as EmotionType,
        intensity: normalizedIntensity,
        description: notes,
        triggers,
        tags,
      };

      let recommendation;

      try {
        recommendation = await this.openAIService.generateRecommendations(
          fakeEntry
        );
      } catch (error: any) {
        this.logger.error(error.message ?? error);
        throw new OpenAIServiceError(
          "Генерація миттєвих рекомендацій",
          error.message
        );
      }

      return res.status(200).json({
        success: true,
        data: {
          recommendations: recommendation,
          basedOn: {
            emotion: EmotionUtils.toUkrainian(fakeEntry.emotion!),
            emotionEnglish: fakeEntry.emotion,
            intensity: normalizedIntensity,
            triggers,
          },
        },
      });
    }
  );

  getOverallSummary = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { timeRange = "month" } = req.query;

    let emotions, stats, patterns, streak;
    try {
      [emotions, stats, patterns, streak] = await Promise.all([
        this.emotionRepository.findByTimeRange(userId, timeRange as string),
        this.emotionRepository.getEmotionStats(userId, {
          timeRange: timeRange as any,
        }),
        this.emotionRepository.getEmotionPatterns(userId, 30),
        this.streakRepository.findByUserId(userId),
      ]);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    let analysis, recommendations;
    try {
      [analysis, recommendations] = await Promise.all([
        this.openAIService.analyzeEmotions(emotions, stats, patterns),
        this.openAIService.generateRecommendations(emotions, stats),
      ]);
    } catch (error: any) {
      throw new OpenAIServiceError("аналіз та рекомендації", error.message);
    }

    let summary;
    try {
      summary = await this.openAIService.generateOverallSummary(
        emotions,
        stats,
        analysis,
        recommendations
      );
    } catch (error: any) {
      throw new SummaryGenerationFailedError(error.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        summary,
        analysis,
        recommendations,
        stats,
        streak: streak
          ? {
              currentStreak: streak.currentStreak,
              longestStreak: streak.longestStreak,
              totalMoodTracked: streak.totalMoodTracked,
              streakStartDate: streak.streakStartDate,
              isActive: streak.isActive,
            }
          : null,
        metadata: {
          timeRange,
          entriesAnalyzed: emotions.length,
          generatedAt: new Date(),
          averageIntensity: stats.averageIntensity,
          mostCommonIntensity: stats.mostCommonIntensity,
          mostCommonEmotion: stats.mostCommonEmotion,
        },
      },
    });
  });
}
