import {
  EmotionEntry,
  EmotionType,
  IEmotionEntry,
} from "@/model/emotional.model";
import mongoose from "mongoose";
import { EmotionUtils } from "@/utils/emotionConverter";

export interface EmotionFilters {
  userId?: string;
  emotion?: EmotionType | EmotionType[];
  intensity?: number;
  minIntensity?: number;
  maxIntensity?: number;
  stressLevel?: number;
  minStressLevel?: number;
  maxStressLevel?: number;
  startDate?: Date;
  endDate?: Date;
  timeRange?: "today" | "week" | "month" | "quarter" | "year";
  tags?: string[];
  triggers?: string[];
  limit?: number;
  skip?: number;
  sortBy?: "createdAt" | "intensity" | "stressLevel" | "emotion";
  sortOrder?: "asc" | "desc";
}

export interface EmotionStats {
  totalEntries: number;
  averageStressLevel: number;
  averageIntensity: number;
  mostCommonEmotion: EmotionType;
  mostCommonIntensity: number;
  emotionDistribution: Record<EmotionType, number>;
  intensityDistribution: Record<number, number>;
  trendsOverTime: any[];
}

export class EmotionRepository {
  async create(emotionData: Partial<IEmotionEntry>): Promise<IEmotionEntry> {
    const emotion = new EmotionEntry({
      ...emotionData,
    });
    return await emotion.save();
  }

  async findAll(filters: EmotionFilters = {}): Promise<IEmotionEntry[]> {
    const query = this.buildQuery(filters);
    const {
      limit = 50,
      skip = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    return await EmotionEntry.find(query)
      .populate("userId", "firstName lastName email")
      .limit(limit)
      .skip(skip)
      .sort(sortObj);
  }

  async findById(id: string): Promise<IEmotionEntry | null> {
    return await EmotionEntry.findById(id).populate(
      "userId",
      "firstName lastName email"
    );
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
      createdAt: { $gte: startDate, $lte: now },
    }).sort({ createdAt: -1 });
  }

  async findByEmotionType(
    userId: string,
    emotions: EmotionType[]
  ): Promise<IEmotionEntry[]> {
    return await EmotionEntry.find({
      userId,
      emotion: { $in: emotions },
    }).sort({ createdAt: -1 });
  }

  async findByIntensity(
    userId: string,
    intensity: number
  ): Promise<IEmotionEntry[]> {
    return await EmotionEntry.find({
      userId,
      intensity,
    }).sort({ createdAt: -1 });
  }

  async getEmotionStats(
    userId: string,
    filters: EmotionFilters = {}
  ): Promise<EmotionStats> {
    const query = this.buildQuery({ ...filters, userId });

    const [
      totalEntries,
      avgStressLevel,
      avgIntensity,
      emotionDistribution,
      intensityDistribution,
    ] = await Promise.all([
      EmotionEntry.countDocuments(query),
      this.getAverageStressLevel(query),
      this.getAverageIntensity(query),
      this.getEmotionDistribution(query),
      this.getIntensityDistribution(query),
    ]);

    const mostCommonEmotion = Object.keys(emotionDistribution).reduce((a, b) =>
      emotionDistribution[a as EmotionType] >
      emotionDistribution[b as EmotionType]
        ? a
        : b
    ) as EmotionType;

    const intensityEntries = Object.entries(intensityDistribution);
    const mostCommonIntensityEntry = intensityEntries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );
    const mostCommonIntensity = Number(mostCommonIntensityEntry[0]);

    const trendsOverTime = await this.getTrendsOverTime(query);

    return {
      totalEntries,
      averageStressLevel: avgStressLevel,
      averageIntensity: avgIntensity,
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
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            emotion: "$emotion",
            intensity: "$intensity",
            hour: { $hour: "$createdAt" },
            dayOfWeek: { $dayOfWeek: "$createdAt" },
          },
          count: { $sum: 1 },
          avgStressLevel: { $avg: "$stressLevel" },
          avgIntensity: { $avg: "$intensity" },
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
    intensity: number
  ): Promise<IEmotionEntry[]> {
    return await EmotionEntry.find({
      userId,
      emotion,
      intensity: { $gte: intensity - 1, $lte: intensity + 1 },
    })
      .limit(10)
      .sort({ createdAt: -1 });
  }

  async count(filters: EmotionFilters = {}): Promise<number> {
    const query = this.buildQuery(filters);
    return await EmotionEntry.countDocuments(query);
  }

  private buildQuery(filters: EmotionFilters): any {
    const query: any = {};

    if (filters.userId) query.userId = filters.userId;

    if (filters.emotion) {
      if (Array.isArray(filters.emotion)) {
        query.emotion = { $in: filters.emotion };
      } else {
        query.emotion = filters.emotion;
      }
    }

    if (filters.intensity) query.intensity = filters.intensity;

    if (filters.minIntensity || filters.maxIntensity) {
      query.intensity = {};
      if (filters.minIntensity) query.intensity.$gte = filters.minIntensity;
      if (filters.maxIntensity) query.intensity.$lte = filters.maxIntensity;
    }

    if (filters.minStressLevel || filters.maxStressLevel) {
      query.stressLevel = {};
      if (filters.minStressLevel)
        query.stressLevel.$gte = filters.minStressLevel;
      if (filters.maxStressLevel)
        query.stressLevel.$lte = filters.maxStressLevel;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    if (filters.timeRange) {
      const timeQuery = this.getTimeRangeQuery(filters.timeRange);
      query.createdAt = timeQuery;
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

  private async getAverageIntensity(query: any): Promise<number> {
    const result = await EmotionEntry.aggregate([
      { $match: query },
      { $group: { _id: null, avg: { $avg: "$intensity" } } },
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
  ): Promise<Record<number, number>> {
    const result = await EmotionEntry.aggregate([
      { $match: query },
      { $group: { _id: "$intensity", count: { $sum: 1 } } },
    ]);

    const distribution: Record<number, number> = {};

    for (let i = 1; i <= 10; i++) {
      distribution[i] = 0;
    }

    result.forEach((item) => {
      if (item._id >= 1 && item._id <= 10) {
        distribution[item._id] = item.count;
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
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          emotions: { $push: "$emotion" },
          intensities: { $push: "$intensity" },
          avgStressLevel: { $avg: "$stressLevel" },
          avgIntensity: { $avg: "$intensity" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);
  }
}
