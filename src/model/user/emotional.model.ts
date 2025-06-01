import mongoose, { Document } from "mongoose";

enum MoodType {
  MOMENTARY = "momentary",
  DAILY_SUMMARY = "daily_summary"
}

enum MoodValue {
  VERY_UNPLEASANT = "very_unpleasant",
  UNPLEASANT = "unpleasant", 
  SLIGHTLY_UNPLEASANT = "slightly_unpleasant",
  NEUTRAL = "neutral",
  SLIGHTLY_PLEASANT = "slightly_pleasant",
  PLEASANT = "pleasant",
  VERY_PLEASANT = "very_pleasant"
}

enum FeelingDescriptor {
  // Positive feelings
  CONFIDENT = "confident",
  PROUD = "proud",
  GRATEFUL = "grateful",
  HOPEFUL = "hopeful",
  JOYFUL = "joyful",
  PEACEFUL = "peaceful",
  CONTENT = "content",
  EXCITED = "excited",
  LOVED = "loved",
  ACCOMPLISHED = "accomplished",
  ENERGETIC = "energetic",
  OPTIMISTIC = "optimistic",
  RELAXED = "relaxed",
  INSPIRED = "inspired",
  AMAZED = "amazed",
  
  // Neutral/Mixed feelings
  SURPRISED = "surprised",
  CURIOUS = "curious",
  FOCUSED = "focused",
  DETERMINED = "determined",
  THOUGHTFUL = "thoughtful",
  
  // Negative feelings
  STRESSED = "stressed",
  ANXIOUS = "anxious",
  SAD = "sad",
  FRUSTRATED = "frustrated",
  ANGRY = "angry",
  OVERWHELMED = "overwhelmed",
  LONELY = "lonely",
  WORRIED = "worried",
  DISAPPOINTED = "disappointed",
  TIRED = "tired",
  IRRITATED = "irritated",
  CONFUSED = "confused",
  BORED = "bored",
  NERVOUS = "nervous",
  GUILTY = "guilty"
}

export interface IEmotionalEntry extends Document {
  userId: mongoose.Types.ObjectId;
  type: MoodType;
  moodValue: MoodValue;
  feelingDescriptors: FeelingDescriptor[];
  notes?: string;
  context?: string;
  timestamp: Date;
  dayDate: Date; // Date without time for daily grouping
}

const emotionalEntrySchema = new mongoose.Schema<IEmotionalEntry>(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    type: {
      type: String,
      enum: Object.values(MoodType),
      required: true
    },
    moodValue: {
      type: String,
      enum: Object.values(MoodValue),
      required: true
    },
    feelingDescriptors: [{
      type: String,
      enum: Object.values(FeelingDescriptor)
    }],
    notes: {
      type: String,
      maxlength: 500
    },
    context: {
      type: String,
      maxlength: 200
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    dayDate: {
      type: Date,
      required: true
    }
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

emotionalEntrySchema.index({ userId: 1, dayDate: -1 });
emotionalEntrySchema.index({ userId: 1, timestamp: -1 });
emotionalEntrySchema.index({ userId: 1, type: 1, dayDate: -1 });

emotionalEntrySchema.pre('save', function(next) {
  if (!this.dayDate) {
    const date = new Date(this.timestamp);
    this.dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  next();
});

emotionalEntrySchema.statics.getEntriesForDay = function(userId: mongoose.Types.ObjectId, date: Date) {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return this.find({
    userId,
    dayDate: startOfDay
  }).sort({ timestamp: -1 });
};

emotionalEntrySchema.statics.getEntriesForDateRange = function(
  userId: mongoose.Types.ObjectId, 
  startDate: Date, 
  endDate: Date
) {
  return this.find({
    userId,
    dayDate: {
      $gte: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
      $lte: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    }
  }).sort({ timestamp: -1 });
};

export const EmotionalEntry = mongoose.model<IEmotionalEntry>("EmotionalEntry", emotionalEntrySchema);