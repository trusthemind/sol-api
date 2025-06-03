import mongoose, { Document } from "mongoose";

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

export enum IntensityLevel {
  VERY_LOW = "VERY_LOW",
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

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
      enum: Object.values(EmotionType),
      required: true,
      index: true,
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
      enum: Object.values(EmotionType),
    },
    moodAfter: {
      type: String,
      enum: Object.values(EmotionType),
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
        return ret;
      },
    },
  }
);

emotionEntrySchema.index({ userId: 1, recordedAt: -1 });
emotionEntrySchema.index({ emotion: 1, intensity: 1 });
emotionEntrySchema.index({ userId: 1, emotion: 1, recordedAt: -1 });
emotionEntrySchema.index({ doctorId: 1, recordedAt: -1 });

export const EmotionEntry = mongoose.model<IEmotionEntry>(
  "EmotionEntry",
  emotionEntrySchema
);
