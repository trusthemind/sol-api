import mongoose, { Document, Schema } from "mongoose";

export interface IStreak extends Document {
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  streakStartDate?: Date;
  lastActivityDate?: Date;
  totalMoodTracked: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const streakSchema = new Schema<IStreak>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    streakStartDate: {
      type: Date,
    },
    lastActivityDate: {
      type: Date,
    },
    totalMoodTracked: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

streakSchema.index({ userId: 1 });

export const Streak = mongoose.model<IStreak>("Streak", streakSchema);
