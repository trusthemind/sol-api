import {
  EmotionFilters,
  EmotionRepository,
} from "@/repositories/emotional.repository";
import { OpenAIService } from "@/services/openai.service";
import { Request, Response } from "express";
import { asyncHandler } from "@/errors";
import {
  EmotionNotFoundError,
  EmotionCreationFailedError,
  EmotionUpdateFailedError,
  EmotionDeletionFailedError,
  InvalidEmotionDataError,
  InvalidTimeRangeError,
  EmotionStatsGenerationError,
  EmotionPatternAnalysisError,
  EmotionSearchFailedError,
  SummaryGenerationFailedError,
  EmotionEnrichmentFailedError,
  InvalidEmotionFiltersError,
  EmotionDataFetchFailedError,
  OpenAIServiceError,
  IntensityConversionError,
} from "@/errors";
import {
  IntensityConverter,
  IntensityDatabaseHelper,
  IntensityLevel,
} from "@/utils/intensityConverter";
import {
  EmotionEntry,
  EmotionType,
  IEmotionEntry,
} from "@/model/user/emotional.model";
import Logger from "@/utils/logger";

export class EmotionController {
  private emotionRepository: EmotionRepository;
  private openAIService: OpenAIService;
  private readonly logger = new Logger(EmotionController.name);

  constructor() {
    this.emotionRepository = new EmotionRepository();
    this.openAIService = new OpenAIService();
  }

  createEmotion = asyncHandler(async (req: Request, res: Response) => {
    const emotionData = req.body;

    if (!emotionData || !emotionData.userId || !emotionData.emotion) {
      throw new InvalidEmotionDataError(
        "userId та emotion є обов'язковими полями"
      );
    }

    let preparedData;
    try {
      const convertedEmotion = EmotionEntry.convertEmotionToEnglish(
        emotionData.emotion
      );

      const convertedIntensity = EmotionEntry.convertIntensityToEnum(
        emotionData.intensity || 5
      );

      preparedData = {
        ...emotionData,
        emotion: convertedEmotion,
        intensity: convertedIntensity,
      };
    } catch (error: any) {
      throw new IntensityConversionError(error.message);
    }

    let emotion;
    try {
      emotion = await this.emotionRepository.create(preparedData);
    } catch (error: any) {
      throw new EmotionCreationFailedError(error.message);
    }

    const enrichedEmotion = emotion.toObject ? emotion.toObject() : emotion;

    res.status(201).json({
      success: true,
      message: "Запис емоції створено успішно",
      data: enrichedEmotion,
    });
  });

  getAllEmotions = asyncHandler(async (req: Request, res: Response) => {
    let convertedIntensity;
    if (req.query.intensity) {
      try {
        convertedIntensity = IntensityConverter.toDatabase(req.query.intensity);
      } catch (error) {
        throw new IntensityConversionError(req.query.intensity as string);
      }
    }

    const filters: EmotionFilters = {
      userId: req.query.userId as string,
      emotion: req.query.emotion as any,
      intensity: convertedIntensity ?? undefined,
      timeRange: req.query.timeRange as any,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      skip: req.query.skip ? Number(req.query.skip) : 0,
      sortBy: (req.query.sortBy as any) || "recordedAt",
      sortOrder: (req.query.sortOrder as any) || "desc",
    };

    // Validate filters
    if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
      throw new InvalidEmotionFiltersError(["limit повинен бути між 1 та 100"]);
    }

    let emotions, total;
    try {
      [emotions, total] = await Promise.all([
        this.emotionRepository.findAll(filters),
        this.emotionRepository.count(filters),
      ]);
    } catch (error: any) {
      throw new EmotionDataFetchFailedError(error.message);
    }

    let enrichedEmotions;
    try {
      enrichedEmotions = emotions.map((emotion) =>
        IntensityDatabaseHelper.enrichResponse(
          emotion.toObject ? emotion.toObject() : emotion
        )
      );
    } catch (error) {
      throw new EmotionEnrichmentFailedError(
        "Не вдалося збагатити дані емоцій"
      );
    }

    res.status(200).json({
      success: true,
      data: enrichedEmotions,
      total,
      filters,
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

    let enrichedEmotion;
    try {
      enrichedEmotion = IntensityDatabaseHelper.enrichResponse(
        emotion.toObject ? emotion.toObject() : emotion
      );
    } catch (error) {
      throw new EmotionEnrichmentFailedError();
    }

    res.status(200).json({
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

    // Handle intensity conversion for updates if intensity is provided
    if (updateData.intensity !== undefined) {
      try {
        let intensityValue = updateData.intensity;

        // If intensity is a string number, convert to number
        if (
          typeof intensityValue === "string" &&
          !isNaN(Number(intensityValue))
        ) {
          intensityValue = Number(intensityValue);
        }

        // If intensity is not a valid number, throw error
        if (
          typeof intensityValue !== "number" ||
          intensityValue < 1 ||
          intensityValue > 10
        ) {
          throw new Error(
            `Invalid intensity value: ${updateData.intensity}. Must be a number between 1 and 10.`
          );
        }

        updateData.intensity = IntensityConverter.toDatabase(intensityValue);
      } catch (error: any) {
        throw new IntensityConversionError(updateData.intensity);
      }
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

    let enrichedEmotion;
    try {
      enrichedEmotion = IntensityDatabaseHelper.enrichResponse(
        emotion.toObject ? emotion.toObject() : emotion
      );
    } catch (error) {
      throw new EmotionEnrichmentFailedError();
    }

    res.status(200).json({
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

    res.status(200).json({
      success: true,
      message: "Запис емоції видалено успішно",
    });
  });

  getEmotionsByTimeRange = asyncHandler(async (req: Request, res: Response) => {
    const { userId, timeRange } = req.params;

    const validTimeRanges = ["day", "week", "month", "year"];
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

    let enrichedEmotions;
    try {
      enrichedEmotions = emotions.map((emotion) =>
        IntensityDatabaseHelper.enrichResponse(
          emotion.toObject ? emotion.toObject() : emotion
        )
      );
    } catch (error) {
      throw new EmotionEnrichmentFailedError();
    }

    res.status(200).json({
      success: true,
      data: enrichedEmotions,
      timeRange,
      count: emotions.length,
    });
  });

  getEmotionStats = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const filters: EmotionFilters = {
      timeRange: req.query.timeRange as any,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    };

    let stats;
    try {
      stats = await this.emotionRepository.getEmotionStats(userId, filters);
    } catch (error: any) {
      throw new EmotionStatsGenerationError(error.message);
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  getEmotionPatterns = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = req.query.days ? Number(req.query.days) : 30;

    if (days < 1 || days > 365) {
      throw new InvalidEmotionFiltersError(["days повинен бути між 1 та 365"]);
    }

    let patterns;
    try {
      patterns = await this.emotionRepository.getEmotionPatterns(userId, days);
    } catch (error: any) {
      throw new EmotionPatternAnalysisError(error.message);
    }

    res.status(200).json({
      success: true,
      data: patterns,
      period: `${days} днів`,
    });
  });

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

    res.status(200).json({
      success: true,
      data: {
        analysis,
        summary: {
          totalEntries: stats.totalEntries,
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

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        basedOn: {
          entriesAnalyzed: emotions.length,
          timeRange,
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

      if (!emotion || !intensity) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: emotion, intensity",
        });
      }

      const fakeEntry: Partial<IEmotionEntry> = {
        emotion: emotion as EmotionType,
        intensity: IntensityConverter.toDatabase(intensity) ?? undefined,
        description: notes,
        triggers,
        tags,
      };

      let recommendation;

      try {
        recommendation = await new OpenAIService().generateRecommendations(
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
            emotion,
            intensity,
            triggers,
          },
        },
      });
    }
  );

  getOverallSummary = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    console.log("Fetching overall summary for user:", userId);
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

    console.log(emotions, stats, patterns);
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

    res.status(200).json({
      success: true,
      data: {
        summary,
        analysis,
        recommendations,
        stats,
        metadata: {
          timeRange,
          entriesAnalyzed: emotions.length,
          generatedAt: new Date(),
          mostCommonIntensity: stats.mostCommonIntensity,
          mostCommonEmotion: stats.mostCommonEmotion,
        },
      },
    });
  });

  searchEmotions = asyncHandler(async (req: Request, res: Response) => {
    let convertedIntensity;
    if (req.query.intensity)
      try {
        convertedIntensity = IntensityConverter.toDatabase(req.query.intensity);
      } catch (error) {
        throw new IntensityConversionError(req.query.intensity as string);
      }

    const filters: EmotionFilters = {
      userId: req.query.userId as string,
      emotion: req.query.emotions
        ? ((req.query.emotions as string).split(",") as any)
        : undefined,
      intensity: convertedIntensity ?? undefined,
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

    let emotions, total;
    try {
      [emotions, total] = await Promise.all([
        this.emotionRepository.findAll(filters),
        this.emotionRepository.count(filters),
      ]);
    } catch (error: any) {
      throw new EmotionSearchFailedError(error.message);
    }

    let enrichedEmotions;
    try {
      enrichedEmotions = emotions.map((emotion) =>
        IntensityDatabaseHelper.enrichResponse(
          emotion.toObject ? emotion.toObject() : emotion
        )
      );
    } catch (error) {
      throw new EmotionEnrichmentFailedError();
    }

    res.status(200).json({
      success: true,
      data: enrichedEmotions,
      total,
      filters,
    });
  });
}
