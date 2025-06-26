import {
  EmotionEntry,
  EmotionType,
  EmotionTypeUkrainian,
  IEmotionEntry,
  EMOTION_MAPPING,
} from "@/model/emotional.model";
import mongoose from "mongoose";
import { EmotionUtils } from "@/utils/emotionConverter";

// Language support
export type SupportedLanguage = 'en' | 'uk';

// Updated translations using your existing emotion types
const ukrainianTranslations = {
  emotions: EMOTION_MAPPING.toUkrainian,
  timeRanges: {
    today: 'сьогодні',
    week: 'тиждень',
    month: 'місяць',
    quarter: 'квартал',
    year: 'рік',
  },
  stats: {
    totalEntries: 'Загальна кількість записів',
    averageStressLevel: 'Середній рівень стресу',
    averageIntensity: 'Середня інтенсивність',
    mostCommonEmotion: 'Найпоширеніша емоція',
    mostCommonIntensity: 'Найпоширена інтенсивність',
    emotionDistribution: 'Розподіл емоцій',
    intensityDistribution: 'Розподіл інтенсивності',
    trendsOverTime: 'Тенденції з часом',
  },
  fields: {
    description: 'Опис',
    triggers: 'Тригери',
    tags: 'Теги',
    stressLevel: 'Рівень стресу',
    activities: 'Активності',
    intensity: 'Інтенсивність',
    emotion: 'Емоція',
    createdAt: 'Дата створення',
  }
};

const englishTranslations = {
  emotions: {
    [EmotionType.JOYFUL]: 'Joyful',
    [EmotionType.SATISFIED]: 'Satisfied',
    [EmotionType.NEUTRAL]: 'Neutral',
    [EmotionType.ANXIOUS]: 'Anxious',
    [EmotionType.SAD]: 'Sad',
    [EmotionType.ANGRY]: 'Angry',
    [EmotionType.EXCITED]: 'Excited',
    [EmotionType.TIRED]: 'Tired',
  },
  timeRanges: {
    today: 'today',
    week: 'week',
    month: 'month',
    quarter: 'quarter',
    year: 'year',
  },
  stats: {
    totalEntries: 'Total Entries',
    averageStressLevel: 'Average Stress Level',
    averageIntensity: 'Average Intensity',
    mostCommonEmotion: 'Most Common Emotion',
    mostCommonIntensity: 'Most Common Intensity',
    emotionDistribution: 'Emotion Distribution',
    intensityDistribution: 'Intensity Distribution',
    trendsOverTime: 'Trends Over Time',
  },
  fields: {
    description: 'Description',
    triggers: 'Triggers',
    tags: 'Tags',
    stressLevel: 'Stress Level',
    activities: 'Activities',
    intensity: 'Intensity',
    emotion: 'Emotion',
    createdAt: 'Created At',
  }
};

const translations = {
  en: englishTranslations,
  uk: ukrainianTranslations,
};

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
  activities?: string[];
  limit?: number;
  skip?: number;
  sortBy?: "createdAt" | "intensity" | "stressLevel" | "emotion";
  sortOrder?: "asc" | "desc";
  language?: SupportedLanguage;
}

export interface EmotionStats {
  totalEntries: number;
  averageStressLevel: number | null;
  averageIntensity: number | null;
  mostCommonEmotion: EmotionType | null;
  mostCommonIntensity: number | null;
  emotionDistribution: Record<EmotionType, number>;
  intensityDistribution: Record<number, number>;
  stressDistribution: Record<number, number>;
  trendsOverTime: any[];
  // Localized labels
  labels?: {
    totalEntries: string;
    averageStressLevel: string;
    averageIntensity: string;
    mostCommonEmotion: string;
    mostCommonIntensity: string;
    emotionDistribution: string;
    intensityDistribution: string;
    trendsOverTime: string;
  };
  emotionLabels?: Record<EmotionType, string>;
  fieldLabels?: Record<string, string>;
}

export interface LocalizedEmotionEntry extends IEmotionEntry {
  emotionLabel?: string;
  fieldLabels?: Record<string, string>;
}

export class EmotionRepository {
  private defaultLanguage: SupportedLanguage = 'en';

  constructor(defaultLanguage: SupportedLanguage = 'en') {
    this.defaultLanguage = defaultLanguage;
  }

  // Helper method to get translations
  private getTranslations(language?: SupportedLanguage) {
    const lang = language || this.defaultLanguage;
    return translations[lang];
  }

  // Helper method to translate emotion type
  private translateEmotion(emotion: EmotionType, language?: SupportedLanguage): string {
    const lang = language || this.defaultLanguage;
    if (lang === 'uk') {
      return EMOTION_MAPPING.toUkrainian[emotion];
    }
    return translations.en.emotions[emotion];
  }

  // Helper method to localize emotion entry
  private localizeEmotionEntry(
    entry: IEmotionEntry, 
    language?: SupportedLanguage
  ): LocalizedEmotionEntry {
    const lang = language || this.defaultLanguage;
    const trans = this.getTranslations(lang);
    
    return {
      ...entry.toObject(),
      emotionLabel: this.translateEmotion(entry.emotion, lang),
      fieldLabels: trans.fields,
    };
  }

  async create(emotionData: Partial<IEmotionEntry>): Promise<IEmotionEntry> {
    // The model already handles emotion conversion via EmotionUtils.toEnglish
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

  async findAllLocalized(filters: EmotionFilters = {}): Promise<LocalizedEmotionEntry[]> {
    const entries = await this.findAll(filters);
    return entries.map(entry => this.localizeEmotionEntry(entry, filters.language));
  }

  async findById(id: string): Promise<IEmotionEntry | null> {
    return await EmotionEntry.findById(id).populate(
      "userId",
      "firstName lastName email"
    );
  }

  async findByIdLocalized(
    id: string, 
    language?: SupportedLanguage
  ): Promise<LocalizedEmotionEntry | null> {
    const entry = await this.findById(id);
    return entry ? this.localizeEmotionEntry(entry, language) : null;
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
    const language = filters.language || this.defaultLanguage;
    const trans = this.getTranslations(language);

    const [
      totalEntries,
      avgStressLevel,
      avgIntensity,
      emotionDistribution,
      intensityDistribution,
      stressDistribution,
    ] = await Promise.all([
      EmotionEntry.countDocuments(query),
      this.getAverageStressLevel(query),
      this.getAverageIntensity(query),
      this.getEmotionDistribution(query),
      this.getIntensityDistribution(query),
      this.getStressDistribution(query),
    ]);

    // Find most common emotion, but only if there are actual entries
    let mostCommonEmotion: EmotionType | null = null;
    if (totalEntries > 0) {
      const emotionsWithCounts = Object.entries(emotionDistribution).filter(([_, count]) => count > 0);
      if (emotionsWithCounts.length > 0) {
        mostCommonEmotion = emotionsWithCounts.reduce((a, b) =>
          a[1] > b[1] ? a : b
        )[0] as EmotionType;
      }
    }

    // Find most common intensity, but only if there are actual entries
    let mostCommonIntensity: number | null = null;
    if (totalEntries > 0) {
      const intensityEntries = Object.entries(intensityDistribution).filter(([_, count]) => count > 0);
      if (intensityEntries.length > 0) {
        const mostCommonIntensityEntry = intensityEntries.reduce((max, current) =>
          current[1] > max[1] ? current : max
        );
        mostCommonIntensity = Number(mostCommonIntensityEntry[0]);
      }
    }

    const trendsOverTime = await this.getTrendsOverTime(query);

    // Create emotion labels for the current language
    const emotionLabels: Record<EmotionType, string> = {} as any;
    Object.values(EmotionType).forEach((emotion) => {
      emotionLabels[emotion] = this.translateEmotion(emotion, language);
    });

    return {
      totalEntries,
      averageStressLevel: avgStressLevel,
      averageIntensity: avgIntensity,
      mostCommonEmotion,
      mostCommonIntensity,
      emotionDistribution,
      intensityDistribution,
      stressDistribution,
      trendsOverTime,
      labels: {
        totalEntries: trans.stats.totalEntries,
        averageStressLevel: trans.stats.averageStressLevel,
        averageIntensity: trans.stats.averageIntensity,
        mostCommonEmotion: trans.stats.mostCommonEmotion,
        mostCommonIntensity: trans.stats.mostCommonIntensity,
        emotionDistribution: trans.stats.emotionDistribution,
        intensityDistribution: trans.stats.intensityDistribution,
        trendsOverTime: trans.stats.trendsOverTime,
      },
      emotionLabels,
      fieldLabels: trans.fields,
    };
  }

  async getEmotionPatterns(
    userId: string, 
    days: number = 30,
    language?: SupportedLanguage
  ): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const patterns = await EmotionEntry.aggregate([
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
          commonTriggers: { $addToSet: "$triggers" },
          commonActivities: { $addToSet: "$activities" },
          commonTags: { $addToSet: "$tags" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Add localized emotion labels
    if (language) {
      return patterns.map(pattern => ({
        ...pattern,
        emotionLabel: this.translateEmotion(pattern._id.emotion, language)
      }));
    }

    return patterns;
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

  // Get available emotions with translations
  getEmotionOptions(language?: SupportedLanguage): Array<{value: EmotionType, label: string}> {
    const lang = language || this.defaultLanguage;
    
    return Object.values(EmotionType).map(emotion => ({
      value: emotion,
      label: this.translateEmotion(emotion, lang)
    }));
  }

  // Get time range options with translations
  getTimeRangeOptions(language?: SupportedLanguage): Array<{value: string, label: string}> {
    const lang = language || this.defaultLanguage;
    const trans = this.getTranslations(lang);
    
    return [
      { value: 'today', label: trans.timeRanges.today },
      { value: 'week', label: trans.timeRanges.week },
      { value: 'month', label: trans.timeRanges.month },
      { value: 'quarter', label: trans.timeRanges.quarter },
      { value: 'year', label: trans.timeRanges.year },
    ];
  }

  // Get activity insights
  async getActivityInsights(
    userId: string,
    filters: EmotionFilters = {}
  ): Promise<{
    emotionByActivity: Record<string, Record<EmotionType, number>>;
    avgIntensityByActivity: Record<string, number>;
    avgStressByActivity: Record<string, number>;
  }> {
    const query = this.buildQuery({ ...filters, userId });
    
    const results = await EmotionEntry.aggregate([
      { $match: query },
      { $unwind: "$activities" },
      {
        $group: {
          _id: {
            activity: "$activities",
            emotion: "$emotion"
          },
          count: { $sum: 1 },
          avgIntensity: { $avg: "$intensity" },
          avgStress: { $avg: "$stressLevel" }
        }
      }
    ]);

    const emotionByActivity: Record<string, Record<EmotionType, number>> = {};
    const avgIntensityByActivity: Record<string, number> = {};
    const avgStressByActivity: Record<string, number> = {};

    results.forEach(result => {
      const activity = result._id.activity;
      const emotion = result._id.emotion as EmotionType;
      
      if (!emotionByActivity[activity]) {
        emotionByActivity[activity] = {} as Record<EmotionType, number>;
        Object.values(EmotionType).forEach(e => {
          emotionByActivity[activity][e] = 0;
        });
      }
      
      emotionByActivity[activity][emotion] = result.count;
      avgIntensityByActivity[activity] = result.avgIntensity;
      avgStressByActivity[activity] = result.avgStress;
    });

    return {
      emotionByActivity,
      avgIntensityByActivity,
      avgStressByActivity
    };
  }

  // Get trigger analysis
  async getTriggerAnalysis(
    userId: string,
    filters: EmotionFilters = {}
  ): Promise<{
    triggerEmotionMap: Record<string, Record<EmotionType, number>>;
    mostStressfulTriggers: Array<{trigger: string, avgStress: number, count: number}>;
  }> {
    const query = this.buildQuery({ ...filters, userId });
    
    const results = await EmotionEntry.aggregate([
      { $match: query },
      { $unwind: "$triggers" },
      {
        $group: {
          _id: {
            trigger: "$triggers",
            emotion: "$emotion"
          },
          count: { $sum: 1 },
          avgStress: { $avg: "$stressLevel" }
        }
      },
      { $sort: { avgStress: -1 } }
    ]);

    const triggerEmotionMap: Record<string, Record<EmotionType, number>> = {};
    const triggerStressMap: Record<string, {stress: number, count: number}> = {};

    results.forEach(result => {
      const trigger = result._id.trigger;
      const emotion = result._id.emotion as EmotionType;
      
      if (!triggerEmotionMap[trigger]) {
        triggerEmotionMap[trigger] = {} as Record<EmotionType, number>;
        Object.values(EmotionType).forEach(e => {
          triggerEmotionMap[trigger][e] = 0;
        });
      }
      
      triggerEmotionMap[trigger][emotion] = result.count;
      
      if (!triggerStressMap[trigger]) {
        triggerStressMap[trigger] = { stress: 0, count: 0 };
      }
      triggerStressMap[trigger].stress += result.avgStress * result.count;
      triggerStressMap[trigger].count += result.count;
    });

    const mostStressfulTriggers = Object.entries(triggerStressMap)
      .map(([trigger, data]) => ({
        trigger,
        avgStress: data.stress / data.count,
        count: data.count
      }))
      .sort((a, b) => b.avgStress - a.avgStress)
      .slice(0, 10);

    return {
      triggerEmotionMap,
      mostStressfulTriggers
    };
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

    if (filters.activities && filters.activities.length > 0) {
      query.activities = { $in: filters.activities };
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

  private async getAverageStressLevel(query: any): Promise<number | null> {
    const result = await EmotionEntry.aggregate([
      { $match: query },
      { $group: { _id: null, avg: { $avg: "$stressLevel" } } },
    ]);
    return result[0]?.avg || null;
  }

  private async getAverageIntensity(query: any): Promise<number | null> {
    const result = await EmotionEntry.aggregate([
      { $match: query },
      { $group: { _id: null, avg: { $avg: "$intensity" } } },
    ]);
    return result[0]?.avg || null;
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

  private async getStressDistribution(
    query: any
  ): Promise<Record<number, number>> {
    const result = await EmotionEntry.aggregate([
      { $match: query },
      { $match: { stressLevel: { $exists: true, $ne: null } } },
      { $group: { _id: "$stressLevel", count: { $sum: 1 } } },
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
          stressLevels: { $push: "$stressLevel" },
          avgStressLevel: { $avg: "$stressLevel" },
          avgIntensity: { $avg: "$intensity" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);
  }
}

