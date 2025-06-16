import { EmotionUtils } from "@/utils/emotionConverter";
import mongoose, { Document, Schema } from "mongoose";

export enum EmotionType {
  JOYFUL = "joyful", // радісний
  SATISFIED = "satisfied", // задоволений
  NEUTRAL = "neutral", // нейтральний
  ANXIOUS = "anxious", // тривожний
  SAD = "sad", // сумний
  ANGRY = "angry", // злий
  EXCITED = "excited", // збуджений
  TIRED = "tired", // втомлений
}

export enum EmotionTypeUkrainian {
  РАДІСНИЙ = "радісний",
  ЗАДОВОЛЕНИЙ = "задоволений",
  НЕЙТРАЛЬНИЙ = "нейтральний",
  ТРИВОЖНИЙ = "тривожний",
  СУМНИЙ = "сумний",
  ЗЛИЙ = "злий",
  ЗБУДЖЕНИЙ = "збуджений",
  ВТОМЛЕНИЙ = "втомлений",
}

export const EMOTION_MAPPING = {
  toEnglish: {
    [EmotionTypeUkrainian.РАДІСНИЙ]: EmotionType.JOYFUL,
    [EmotionTypeUkrainian.ЗАДОВОЛЕНИЙ]: EmotionType.SATISFIED,
    [EmotionTypeUkrainian.НЕЙТРАЛЬНИЙ]: EmotionType.NEUTRAL,
    [EmotionTypeUkrainian.ТРИВОЖНИЙ]: EmotionType.ANXIOUS,
    [EmotionTypeUkrainian.СУМНИЙ]: EmotionType.SAD,
    [EmotionTypeUkrainian.ЗЛИЙ]: EmotionType.ANGRY,
    [EmotionTypeUkrainian.ЗБУДЖЕНИЙ]: EmotionType.EXCITED,
    [EmotionTypeUkrainian.ВТОМЛЕНИЙ]: EmotionType.TIRED,
  },
  toUkrainian: {
    [EmotionType.JOYFUL]: EmotionTypeUkrainian.РАДІСНИЙ,
    [EmotionType.SATISFIED]: EmotionTypeUkrainian.ЗАДОВОЛЕНИЙ,
    [EmotionType.NEUTRAL]: EmotionTypeUkrainian.НЕЙТРАЛЬНИЙ,
    [EmotionType.ANXIOUS]: EmotionTypeUkrainian.ТРИВОЖНИЙ,
    [EmotionType.SAD]: EmotionTypeUkrainian.СУМНИЙ,
    [EmotionType.ANGRY]: EmotionTypeUkrainian.ЗЛИЙ,
    [EmotionType.EXCITED]: EmotionTypeUkrainian.ЗБУДЖЕНИЙ,
    [EmotionType.TIRED]: EmotionTypeUkrainian.ВТОМЛЕНИЙ,
  },
};


export interface IEmotionEntry extends Document {
  userId: mongoose.Types.ObjectId;
  emotion: EmotionType;
  intensity: number;
  description?: string;
  triggers?: string[];
  tags?: string[];
  stressLevel?: number;
  activities?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const emotionEntrySchema = new Schema<IEmotionEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    emotion: {
      type: String,
      enum: Object.values(EmotionType),
      default: EmotionType.NEUTRAL,
      required: true,
      set: function (value: string) {
        return EmotionUtils.toEnglish(value);
      },
    },
    intensity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
      required: true,
      set: function (value: number | string) {
        return EmotionUtils.normalizeIntensity(value);
      },
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
    tags: [
      {
        type: String,
        maxlength: 50,
      },
    ],
    stressLevel: {
      type: Number,
      min: 1,
      max: 10,
      set: function (value: number | string) {
        if (!value) return value;
        return EmotionUtils.normalizeIntensity(value);
      },
    },
    activities: [
      {
        type: String,
        maxlength: 100,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;

        if (ret.emotion)
          ret.emotionUkrainian = EmotionUtils.toUkrainian(ret.emotion);

        return ret;
      },
    },
  }
);

emotionEntrySchema.index({ userId: 1, createdAt: -1 });
emotionEntrySchema.index({ userId: 1, emotion: 1 });

emotionEntrySchema.statics.convertEmotionToEnglish = function (
  emotion: string
): EmotionType {
  return EmotionUtils.toEnglish(emotion);
};

emotionEntrySchema.statics.normalizeIntensity = function (
  intensity: number | string
): number {
  return EmotionUtils.normalizeIntensity(intensity);
};

export const EmotionEntry = mongoose.model<IEmotionEntry>(
  "EmotionEntry",
  emotionEntrySchema
);
