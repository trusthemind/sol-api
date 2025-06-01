import mongoose, { Document } from "mongoose";

enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

enum BloodType {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-",
  UNKNOWN = "unknown",
}

enum ActivityLevel {
  SEDENTARY = "sedentary",
  LIGHTLY_ACTIVE = "lightly_active",
  MODERATELY_ACTIVE = "moderately_active",
  VERY_ACTIVE = "very_active",
  EXTREMELY_ACTIVE = "extremely_active",
}

enum SleepQuality {
  POOR = "poor",
  FAIR = "fair",
  GOOD = "good",
  EXCELLENT = "excellent",
}

export interface IHealth extends Document {
  userId: mongoose.Types.ObjectId;
  age: number;
  gender: Gender;
  bloodType: BloodType;
  activityLevel: ActivityLevel;
  sleepQuality: SleepQuality;
  smokingStatus: "never" | "former" | "current";
  alcoholConsumption: "none" | "occasional" | "moderate" | "heavy";
}

const healthSchema = new mongoose.Schema<IHealth>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: false,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: false,
    },
    bloodType: {
      type: String,
      enum: Object.values(BloodType),
      required: false,
      default: BloodType.UNKNOWN,
    },
    activityLevel: {
      type: String,
      enum: Object.values(ActivityLevel),
      required: false,
    },
    sleepQuality: {
      type: String,
      enum: Object.values(SleepQuality),
      required: false,
    },
    smokingStatus: {
      type: String,
      enum: ["never", "former", "current"],
      required: false,
    },
    alcoholConsumption: {
      type: String,
      enum: ["none", "occasional", "moderate", "heavy"],
      required: false,
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

healthSchema.index({ userId: 1 });

export const Health = mongoose.model<IHealth>("Health", healthSchema);
