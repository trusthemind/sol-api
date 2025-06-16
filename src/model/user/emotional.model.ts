import mongoose, { Document, Model } from "mongoose";

export enum EmotionType {
  HAPPY = "happy",
  SAD = "sad",
  ANGRY = "angry",
  ANXIOUS = "anxious",
  EXCITED = "excited",
  CALM = "calm",
  FRUSTRATED = "frustrated",
  GRATEFUL = "grateful",
  LONELY = "lonely",
  CONFIDENT = "confident",
  OVERWHELMED = "overwhelmed",
  PEACEFUL = "peaceful",
}

// Ukrainian emotion types for frontend compatibility
export enum EmotionTypeUkrainian {
  РАДІСНИЙ = "Радісний",
  СУМНИЙ = "Сумний",
  ЗЛИЙ = "Злий",
  ТРИВОЖНИЙ = "Тривожний",
  ЗБУДЖЕНИЙ = "Збуджений",
  СПОКІЙНИЙ = "Спокійний",
  РОЗЧАРОВАНИЙ = "Розчарований",
  ВДЯЧНИЙ = "Вдячний",
  САМОТНІЙ = "Самотній",
  ВПЕВНЕНИЙ = "Впевнений",
  ПЕРЕВАНТАЖЕНИЙ = "Перевантажений",
  МИРНИЙ = "Мирний",
}

export enum IntensityLevel {
  VERY_LOW = "VERY_LOW",
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

// Mapping between Ukrainian and English emotions
export const EMOTION_MAPPING = {
  // Ukrainian to English
  toEnglish: {
    [EmotionTypeUkrainian.РАДІСНИЙ]: EmotionType.HAPPY,
    [EmotionTypeUkrainian.СУМНИЙ]: EmotionType.SAD,
    [EmotionTypeUkrainian.ЗЛИЙ]: EmotionType.ANGRY,
    [EmotionTypeUkrainian.ТРИВОЖНИЙ]: EmotionType.ANXIOUS,
    [EmotionTypeUkrainian.ЗБУДЖЕНИЙ]: EmotionType.EXCITED,
    [EmotionTypeUkrainian.СПОКІЙНИЙ]: EmotionType.CALM,
    [EmotionTypeUkrainian.РОЗЧАРОВАНИЙ]: EmotionType.FRUSTRATED,
    [EmotionTypeUkrainian.ВДЯЧНИЙ]: EmotionType.GRATEFUL,
    [EmotionTypeUkrainian.САМОТНІЙ]: EmotionType.LONELY,
    [EmotionTypeUkrainian.ВПЕВНЕНИЙ]: EmotionType.CONFIDENT,
    [EmotionTypeUkrainian.ПЕРЕВАНТАЖЕНИЙ]: EmotionType.OVERWHELMED,
    [EmotionTypeUkrainian.МИРНИЙ]: EmotionType.PEACEFUL,
  },
  // English to Ukrainian
  toUkrainian: {
    [EmotionType.HAPPY]: EmotionTypeUkrainian.РАДІСНИЙ,
    [EmotionType.SAD]: EmotionTypeUkrainian.СУМНИЙ,
    [EmotionType.ANGRY]: EmotionTypeUkrainian.ЗЛИЙ,
    [EmotionType.ANXIOUS]: EmotionTypeUkrainian.ТРИВОЖНИЙ,
    [EmotionType.EXCITED]: EmotionTypeUkrainian.ЗБУДЖЕНИЙ,
    [EmotionType.CALM]: EmotionTypeUkrainian.СПОКІЙНИЙ,
    [EmotionType.FRUSTRATED]: EmotionTypeUkrainian.РОЗЧАРОВАНИЙ,
    [EmotionType.GRATEFUL]: EmotionTypeUkrainian.ВДЯЧНИЙ,
    [EmotionType.LONELY]: EmotionTypeUkrainian.САМОТНІЙ,
    [EmotionType.CONFIDENT]: EmotionTypeUkrainian.ВПЕВНЕНИЙ,
    [EmotionType.OVERWHELMED]: EmotionTypeUkrainian.ПЕРЕВАНТАЖЕНИЙ,
    [EmotionType.PEACEFUL]: EmotionTypeUkrainian.МИРНИЙ,
  }
};

// Intensity mapping for 1-10 scale
export const INTENSITY_MAPPING = {
  toEnum: (numericValue: number): IntensityLevel => {
    if (numericValue <= 2) return IntensityLevel.VERY_LOW;
    if (numericValue <= 4) return IntensityLevel.LOW;
    if (numericValue <= 6) return IntensityLevel.MODERATE;
    if (numericValue <= 8) return IntensityLevel.HIGH;
    return IntensityLevel.VERY_HIGH;
  },
  toNumeric: (level: IntensityLevel): number => {
    switch (level) {
      case IntensityLevel.VERY_LOW: return 1;
      case IntensityLevel.LOW: return 3;
      case IntensityLevel.MODERATE: return 5;
      case IntensityLevel.HIGH: return 7;
      case IntensityLevel.VERY_HIGH: return 9;
      default: return 5;
    }
  },
  toUkrainian: (level: IntensityLevel): string => {
    switch (level) {
      case IntensityLevel.VERY_LOW: return "Дуже низький";
      case IntensityLevel.LOW: return "Низький";
      case IntensityLevel.MODERATE: return "Помірний";
      case IntensityLevel.HIGH: return "Високий";
      case IntensityLevel.VERY_HIGH: return "Дуже високий";
      default: return "Невідомий";
    }
  }
};

export const EmotionConverter = {
  toEnglish: (emotion: string): EmotionType => {
    if (EMOTION_MAPPING.toEnglish[emotion as EmotionTypeUkrainian]) {
      return EMOTION_MAPPING.toEnglish[emotion as EmotionTypeUkrainian];
    }
    if (Object.values(EmotionType).includes(emotion as EmotionType)) {
      return emotion as EmotionType;
    }
    throw new Error(`Invalid emotion: ${emotion}`);
  },
  toUkrainian: (emotion: EmotionType): EmotionTypeUkrainian => {
    const ukrainianEmotion = EMOTION_MAPPING.toUkrainian[emotion];
    if (!ukrainianEmotion) {
      throw new Error(`Unknown emotion: ${emotion}`);
    }
    return ukrainianEmotion;
  }
};

export const IntensityConverter = {
  toEnum: (intensity: number | string): IntensityLevel => {
    if (typeof intensity === 'string') {
      if (Object.values(IntensityLevel).includes(intensity as IntensityLevel)) {
        return intensity as IntensityLevel;
      }
      const numValue = parseFloat(intensity);
      if (isNaN(numValue)) {
        throw new Error(`Invalid intensity: ${intensity}`);
      }
      return INTENSITY_MAPPING.toEnum(numValue);
    }
    
    if (typeof intensity === 'number') {
      if (intensity < 1 || intensity > 10) {
        throw new Error(`Intensity must be between 1 and 10, got: ${intensity}`);
      }
      return INTENSITY_MAPPING.toEnum(intensity);
    }
    
    throw new Error(`Invalid intensity type: ${typeof intensity}`);
  },
  toNumeric: (level: IntensityLevel): number => {
    return INTENSITY_MAPPING.toNumeric(level);
  },
  toUkrainian: (level: IntensityLevel): string => {
    return INTENSITY_MAPPING.toUkrainian(level);
  }
};

export interface IEmotionEntry extends Document {
  userId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  emotion: EmotionType;
  intensity: IntensityLevel;
  description?: string;
  triggers?: string[];
  location?: string;
  weather?: string;
  activities?: string[];
  sleepHours?: number;
  stressLevel?: number;
  moodBefore?: EmotionType;
  moodAfter?: EmotionType;
  tags?: string[];
  isPrivate: boolean;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IEmotionEntryModel extends Model<IEmotionEntry> {
  convertEmotionToEnglish(emotion: string): EmotionType;
  convertIntensityToEnum(intensity: number | string): IntensityLevel;
}

const emotionValidator = {
  validator: function(value: string) {
    if (Object.values(EmotionType).includes(value as EmotionType)) {
      return true;
    }
    if (Object.values(EmotionTypeUkrainian).includes(value as EmotionTypeUkrainian)) {
      return true;
    }
    return false;
  },
  message: 'Invalid emotion type. Must be a valid emotion in English or Ukrainian.'
};

const emotionEntrySchema = new mongoose.Schema<IEmotionEntry>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: false,
    },
    emotion: {
      type: String,
      required: true,
      index: true,
      validate: emotionValidator,

      set: function(value: string) {
        if (EMOTION_MAPPING.toEnglish[value as EmotionTypeUkrainian]) 
          return EMOTION_MAPPING.toEnglish[value as EmotionTypeUkrainian];
        return value;
      }
    },
    intensity: {
      type: String,
      enum: Object.values(IntensityLevel),
      required: true,
      default: IntensityLevel.MODERATE,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    triggers: [
      {
        type: String,
        maxlength: 100,
      },
    ],
    location: {
      type: String,
      maxlength: 100,
    },
    weather: {
      type: String,
      maxlength: 50,
    },
    activities: [
      {
        type: String,
        maxlength: 100,
      },
    ],
    sleepHours: {
      type: Number,
      min: 0,
      max: 24,
    },
    stressLevel: {
      type: Number,
      min: 1,
      max: 10,
    },
    moodBefore: {
      type: String,
      validate: emotionValidator,
      set: function(value: string) {
        if (!value) return value;
        if (EMOTION_MAPPING.toEnglish[value as EmotionTypeUkrainian]) {
          return EMOTION_MAPPING.toEnglish[value as EmotionTypeUkrainian];
        }
        return value;
      }
    },
    moodAfter: {
      type: String,
      validate: emotionValidator,
      set: function(value: string) {
        if (!value) return value;
        if (EMOTION_MAPPING.toEnglish[value as EmotionTypeUkrainian]) {
          return EMOTION_MAPPING.toEnglish[value as EmotionTypeUkrainian];
        }
        return value;
      }
    },
    tags: [
      {
        type: String,
        maxlength: 50,
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    recordedAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        
        if (ret.emotion) {
          ret.emotionUkrainian = EMOTION_MAPPING.toUkrainian[ret.emotion as EmotionType];
          ret.emotionEnglish = ret.emotion;
        }
        
        if (ret.intensity) {
          ret.intensityNumeric = INTENSITY_MAPPING.toNumeric(ret.intensity);
          ret.intensityUkrainian = INTENSITY_MAPPING.toUkrainian(ret.intensity);
        }
        
        if (ret.moodBefore) {
          ret.moodBeforeUkrainian = EMOTION_MAPPING.toUkrainian[ret.moodBefore as EmotionType];
        }
        
        if (ret.moodAfter) {
          ret.moodAfterUkrainian = EMOTION_MAPPING.toUkrainian[ret.moodAfter as EmotionType];
        }
        
        return ret;
      },
    },
  }
);

emotionEntrySchema.index({ userId: 1, recordedAt: -1 });
emotionEntrySchema.index({ emotion: 1, intensity: 1 });
emotionEntrySchema.index({ userId: 1, emotion: 1, recordedAt: -1 });
emotionEntrySchema.index({ doctorId: 1, recordedAt: -1 });

emotionEntrySchema.statics.convertEmotionToEnglish = function(emotion: string): EmotionType {
  return EmotionConverter.toEnglish(emotion);
};

emotionEntrySchema.statics.convertIntensityToEnum = function(intensity: number | string): IntensityLevel {
  return IntensityConverter.toEnum(intensity);
};

export const EmotionEntry = mongoose.model<IEmotionEntry, IEmotionEntryModel>(
  "EmotionEntry",
  emotionEntrySchema
);