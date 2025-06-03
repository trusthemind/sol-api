import {
  EmotionEntry,
  EmotionType,
  IEmotionEntry,
  IntensityLevel,
} from "@/model/user/emotional.model";
import mongoose from "mongoose";

export interface EmotionFilters {
  userId?: string;
  doctorId?: string;
  emotion?: EmotionType | EmotionType[];
  intensity?: IntensityLevel;
  stressLevel?: number;
  minStressLevel?: number;
  maxStressLevel?: number;
  startDate?: Date;
  endDate?: Date;
  timeRange?: "today" | "week" | "month" | "quarter" | "year";
  tags?: string[];
  triggers?: string[];
  isPrivate?: boolean;
  limit?: number;
  skip?: number;
  sortBy?: "recordedAt" | "intensity" | "stressLevel" | "emotion";
  sortOrder?: "asc" | "desc";
}

export interface EmotionStats {
  totalEntries: number;
  averageStressLevel: number;
  mostCommonEmotion: EmotionType;
  mostCommonIntensity: IntensityLevel;
  emotionDistribution: Record<EmotionType, number>;
  intensityDistribution: Record<IntensityLevel, number>;
  trendsOverTime: any[];
}

export class EmotionRepository {
  async create(emotionData: Partial<IEmotionEntry>): Promise<IEmotionEntry> {
    const emotion = new EmotionEntry({
      ...emotionData,
      recordedAt: emotionData.recordedAt || new Date(),
    });
    return await emotion.save();
  }

  async findAll(filters: EmotionFilters = {}): Promise<IEmotionEntry[]> {
    const query = this.buildQuery(filters);
    const {
      limit = 50,
      skip = 0,
      sortBy = "recordedAt",
      sortOrder = "desc",
    } = filters;

    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    return await EmotionEntry.find(query)
      .populate("userId", "firstName lastName email")
      .populate("doctorId", "firstName lastName")
      .limit(limit)
      .skip(skip)
      .sort(sortObj);
  }

  async findById(id: string): Promise<IEmotionEntry | null> {
    return await EmotionEntry.findById(id)
      .populate("userId", "firstName lastName email")
      .populate("doctorId", "firstName lastName");
  }

  async update(
    id: string,
    updateData: Partial<IEmotionEntry>
  ): Promise<IEmotionEntry | null> {
    return await EmotionEntry.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<IEmotionEntry | null> {
    return await EmotionEntry.findByIdAndDelete(id);
  }

  async findByTimeRange(
    userId: string,
    timeRange: string
  ): Promise<IEmotionEntry[]> {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return await EmotionEntry.find({
      userId,
      recordedAt: { $gte: startDate, $lte: now },
    }).sort({ recordedAt: -1 });
  }

  async findByEmotionType(
    userId: string,
    emotions: EmotionType[]
  ): Promise<IEmotionEntry[]> {
    return await EmotionEntry.find({
      userId,
      emotion: { $in: emotions },
    }).sort({ recordedAt: -1 });
  }

  async findByIntensity(
    userId: string,
    intensity: IntensityLevel
  ): Promise<IEmotionEntry[]> {
    return await EmotionEntry.find({
      userId,
      intensity
    }).sort({ recordedAt: -1 });
  }

  async getEmotionStats(
    userId: string,
    filters: EmotionFilters = {}
  ): Promise<EmotionStats> {
    const query = this.buildQuery({ ...filters, userId });

    const [
      totalEntries,
      avgStressLevel,
      emotionDistribution,
      intensityDistribution,
    ] = await Promise.all([
      EmotionEntry.countDocuments(query),
      this.getAverageStressLevel(query),
      this.getEmotionDistribution(query),
      this.getIntensityDistribution(query),
    ]);

    const mostCommonEmotion = Object.keys(emotionDistribution).reduce((a, b) =>
      emotionDistribution[a as EmotionType] >
      emotionDistribution[b as EmotionType]
        ? a
        : b
    ) as EmotionType;

    const mostCommonIntensity = Object.keys(intensityDistribution).reduce((a, b) =>
      intensityDistribution[a as IntensityLevel] >
      intensityDistribution[b as IntensityLevel]
        ? a
        : b
    ) as IntensityLevel;

    const trendsOverTime = await this.getTrendsOverTime(query);

    return {
      totalEntries,
      averageStressLevel: avgStressLevel,
      mostCommonEmotion,
      mostCommonIntensity,
      emotionDistribution,
      intensityDistribution,
      trendsOverTime,
    };
  }

  async getEmotionPatterns(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await EmotionEntry.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          recordedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            emotion: "$emotion",
            intensity: "$intensity",
            hour: { $hour: "$recordedAt" },
            dayOfWeek: { $dayOfWeek: "$recordedAt" },
          },
          count: { $sum: 1 },
          avgStressLevel: { $avg: "$stressLevel" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }

  async findSimilarEmotions(
    userId: string,
    emotion: EmotionType,
    intensity: IntensityLevel
  ): Promise<IEmotionEntry[]> {
    return await EmotionEntry.find({
      userId,
      emotion,
      intensity
    })
      .limit(10)
      .sort({ recordedAt: -1 });
  }

  async count(filters: EmotionFilters = {}): Promise<number> {
    const query = this.buildQuery(filters);
    return await EmotionEntry.countDocuments(query);
  }

  private buildQuery(filters: EmotionFilters): any {
    const query: any = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.doctorId) query.doctorId = filters.doctorId;
    if (filters.isPrivate !== undefined) query.isPrivate = filters.isPrivate;

    if (filters.emotion) {
      if (Array.isArray(filters.emotion)) {
        query.emotion = { $in: filters.emotion };
      } else {
        query.emotion = filters.emotion;
      }
    }

    if (filters.intensity) {
      query.intensity = filters.intensity;
    }

    if (filters.minStressLevel || filters.maxStressLevel) {
      query.stressLevel = {};
      if (filters.minStressLevel)
        query.stressLevel.$gte = filters.minStressLevel;
      if (filters.maxStressLevel)
        query.stressLevel.$lte = filters.maxStressLevel;
    }

    if (filters.startDate || filters.endDate) {
      query.recordedAt = {};
      if (filters.startDate) query.recordedAt.$gte = filters.startDate;
      if (filters.endDate) query.recordedAt.$lte = filters.endDate;
    }

    if (filters.timeRange) {
      const timeQuery = this.getTimeRangeQuery(filters.timeRange);
      query.recordedAt = timeQuery;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.triggers && filters.triggers.length > 0) {
      query.triggers = { $in: filters.triggers };
    }

    return query;
  }

  private getTimeRangeQuery(timeRange: string): any {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { $gte: startDate, $lte: now };
  }

  private async getAverageStressLevel(query: any): Promise<number> {
    const result = await EmotionEntry.aggregate([
      { $match: query },
      { $group: { _id: null, avg: { $avg: "$stressLevel" } } },
    ]);
    return result[0]?.avg || 0;
  }

  private async getEmotionDistribution(
    query: any
  ): Promise<Record<EmotionType, number>> {
    const result = await EmotionEntry.aggregate([
      { $match: query },
      { $group: { _id: "$emotion", count: { $sum: 1 } } },
    ]);

    const distribution: Record<EmotionType, number> = {} as any;
    Object.values(EmotionType).forEach((emotion) => {
      distribution[emotion] = 0;
    });

    result.forEach((item) => {
      distribution[item._id as EmotionType] = item.count;
    });

    return distribution;
  }

  private async getIntensityDistribution(
    query: any
  ): Promise<Record<IntensityLevel, number>> {
    const result = await EmotionEntry.aggregate([
      { $match: query },
      { $group: { _id: "$intensity", count: { $sum: 1 } } },
    ]);

    const distribution: Record<IntensityLevel, number> = {} as any;
    
    // Initialize all intensity levels to 0
    Object.values(IntensityLevel).forEach((level) => {
      distribution[level] = 0;
    });

    result.forEach((item) => {
      if (Object.values(IntensityLevel).includes(item._id)) {
        distribution[item._id as IntensityLevel] = item.count;
      }
    });

    return distribution;
  }

  private async getTrendsOverTime(query: any): Promise<any[]> {
    return await EmotionEntry.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: "$recordedAt" },
            month: { $month: "$recordedAt" },
            day: { $dayOfMonth: "$recordedAt" },
          },
          emotions: { $push: "$emotion" },
          intensities: { $push: "$intensity" },
          avgStressLevel: { $avg: "$stressLevel" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);
  }
}