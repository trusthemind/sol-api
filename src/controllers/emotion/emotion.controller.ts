import {
  EmotionFilters,
  EmotionRepository,
} from "@/repositories/emotional.repository";
import { OpenAIService } from "@/services/openai.service";
import {
  IntensityConverter,
  IntensityDatabaseHelper,
} from "@/utils/intensityConverter";
import { Request, Response } from "express";

export class EmotionController {
  private emotionRepository: EmotionRepository;
  private openAIService: OpenAIService;

  constructor() {
    this.emotionRepository = new EmotionRepository();
    this.openAIService = new OpenAIService();
  }

  createEmotion = async (req: Request, res: Response) => {
    try {
      const emotionData = req.body;

      const emotion = await this.emotionRepository.create({
        ...emotionData,
        intensity: IntensityDatabaseHelper.prepareForSave(
          emotionData.intensity
        ),
      });

      const enrichedEmotion = IntensityDatabaseHelper.enrichResponse(
        emotion.toObject ? emotion.toObject() : emotion
      );

      res.status(201).json({
        success: true,
        message: "Emotion entry created successfully",
        data: enrichedEmotion,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error creating emotion entry",
        error: error.message,
      });
    }
  };

  getAllEmotions = async (req: Request, res: Response) => {
    try {
      const filters: EmotionFilters = {
        userId: req.query.userId as string,
        emotion: req.query.emotion as any,
        intensity: req.query.intensity
          ? IntensityConverter.toDatabase(req.query.intensity) ?? undefined
          : undefined,
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

      const emotions = await this.emotionRepository.findAll(filters);
      const total = await this.emotionRepository.count(filters);

      const enrichedEmotions = emotions.map((emotion) =>
        IntensityDatabaseHelper.enrichResponse(
          emotion.toObject ? emotion.toObject() : emotion
        )
      );

      res.status(200).json({
        success: true,
        data: enrichedEmotions,
        total,
        filters,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching emotions",
        error: error.message,
      });
    }
  };

  getEmotionById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const emotion = await this.emotionRepository.findById(id);

      if (!emotion) {
        return res.status(404).json({
          success: false,
          message: "Emotion entry not found",
        });
      }

      const enrichedEmotion = IntensityDatabaseHelper.enrichResponse(
        emotion.toObject ? emotion.toObject() : emotion
      );

      res.status(200).json({
        success: true,
        data: enrichedEmotion,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching emotion",
        error: error.message,
      });
    }
  };

  updateEmotion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const emotion = await this.emotionRepository.update(id, updateData);

      if (!emotion) {
        return res.status(404).json({
          success: false,
          message: "Emotion entry not found",
        });
      }

      const enrichedEmotion = IntensityDatabaseHelper.enrichResponse(
        emotion.toObject ? emotion.toObject() : emotion
      );

      res.status(200).json({
        success: true,
        message: "Emotion entry updated successfully",
        data: enrichedEmotion,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error updating emotion",
        error: error.message,
      });
    }
  };

  deleteEmotion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const emotion = await this.emotionRepository.delete(id);

      if (!emotion) {
        return res.status(404).json({
          success: false,
          message: "Emotion entry not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Emotion entry deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error deleting emotion",
        error: error.message,
      });
    }
  };

  getEmotionsByTimeRange = async (req: Request, res: Response) => {
    try {
      const { userId, timeRange } = req.params;
      const emotions = await this.emotionRepository.findByTimeRange(
        userId,
        timeRange
      );

      const enrichedEmotions = emotions.map((emotion) =>
        IntensityDatabaseHelper.enrichResponse(
          emotion.toObject ? emotion.toObject() : emotion
        )
      );

      res.status(200).json({
        success: true,
        data: enrichedEmotions,
        timeRange,
        count: emotions.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching emotions by time range",
        error: error.message,
      });
    }
  };

  getEmotionStats = async (req: Request, res: Response) => {
    try {
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

      const stats = await this.emotionRepository.getEmotionStats(
        userId,
        filters
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching emotion stats",
        error: error.message,
      });
    }
  };

  getEmotionPatterns = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const days = req.query.days ? Number(req.query.days) : 30;

      const patterns = await this.emotionRepository.getEmotionPatterns(
        userId,
        days
      );

      res.status(200).json({
        success: true,
        data: patterns,
        period: `${days} days`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching emotion patterns",
        error: error.message,
      });
    }
  };

  getEmotionAnalysis = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { timeRange = "month" } = req.query;

      const [emotions, stats, patterns] = await Promise.all([
        this.emotionRepository.findByTimeRange(userId, timeRange as string),
        this.emotionRepository.getEmotionStats(userId, {
          timeRange: timeRange as any,
        }),
        this.emotionRepository.getEmotionPatterns(userId, 30),
      ]);

      const analysis = await this.openAIService.analyzeEmotions(
        emotions,
        stats,
        patterns
      );

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error generating emotion analysis",
        error: error.message,
      });
    }
  };

  getRecommendations = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { timeRange = "week" } = req.query;

      const [emotions, stats] = await Promise.all([
        this.emotionRepository.findByTimeRange(userId, timeRange as string),
        this.emotionRepository.getEmotionStats(userId, {
          timeRange: timeRange as any,
        }),
      ]);

      const recommendations = await this.openAIService.generateRecommendations(
        emotions,
        stats
      );

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error generating recommendations",
        error: error.message,
      });
    }
  };

  getOverallSummary = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { timeRange = "month" } = req.query;

      const [emotions, stats, patterns] = await Promise.all([
        this.emotionRepository.findByTimeRange(userId, timeRange as string),
        this.emotionRepository.getEmotionStats(userId, {
          timeRange: timeRange as any,
        }),
        this.emotionRepository.getEmotionPatterns(userId, 30),
      ]);

      const [analysis, recommendations] = await Promise.all([
        this.openAIService.analyzeEmotions(emotions, stats, patterns),
        this.openAIService.generateRecommendations(emotions, stats),
      ]);

      const summary = await this.openAIService.generateOverallSummary(
        emotions,
        stats,
        analysis,
        recommendations
      );

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error generating overall summary",
        error: error.message,
      });
    }
  };

  searchEmotions = async (req: Request, res: Response) => {
    try {
      const filters: EmotionFilters = {
        userId: req.query.userId as string,
        emotion: req.query.emotions
          ? ((req.query.emotions as string).split(",") as any)
          : undefined,
        intensity: req.query.intensity
          ? IntensityConverter.toDatabase(req.query.intensity) ?? undefined
          : undefined,
        tags: req.query.tags
          ? (req.query.tags as string).split(",")
          : undefined,
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

      const emotions = await this.emotionRepository.findAll(filters);
      const total = await this.emotionRepository.count(filters);

      const enrichedEmotions = emotions.map((emotion) =>
        IntensityDatabaseHelper.enrichResponse(
          emotion.toObject ? emotion.toObject() : emotion
        )
      );

      res.status(200).json({
        success: true,
        data: enrichedEmotions,
        total,
        filters,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error searching emotions",
        error: error.message,
      });
    }
  };

  getIntensityHelp = async (req: Request, res: Response) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          description: "Intensity level guide",
          availableLevels: IntensityConverter.getAllLevels(),
          validFormats: IntensityConverter.getValidInputs(),
          examples: {
            create: {
              url: "POST /api/emotions",
              body: {
                userId: "60d5ec49f1b2c8b1f8e4e1a1",
                emotion: "happy",
                intensity: "HIGH",
              },
            },
            filter: {
              url: "GET /api/emotions?userId=123&intensity=HIGH",
              description: "Finds emotions with HIGH intensity",
            },
          },
          storageInfo: {
            database:
              "Stores as enum strings (VERY_LOW, LOW, MODERATE, HIGH, VERY_HIGH)",
            apiResponse: "Returns enum string and description",
            conversion: "Automatic conversion from case-insensitive strings",
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error getting intensity help",
        error: error.message,
      });
    }
  };
}
