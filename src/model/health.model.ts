import mongoose, { Document, Schema } from "mongoose";

export interface IHealth extends Document {
  userId: mongoose.Types.ObjectId;
  height?: number; // cm
  weight?: number; // kg
  bmi?: number;
  allergies?: string[];
}

const healthSchema = new Schema<IHealth>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    height: {
      type: Number,
      min: 0,
      max: 300,
    },
    weight: {
      type: Number,
      min: 0,
      max: 1000,
    },
    bmi: {
      type: Number,
      min: 0,
      max: 100,
    },
    allergies: [{
      type: String,
      trim: true,
    }],
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

healthSchema.pre('save', function(next) {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    this.bmi = Math.round((this.weight / (heightInMeters * heightInMeters)) * 100) / 100;
  }
  next();
});

healthSchema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
  const update = this.getUpdate() as any;
  
  if (update.weight && update.height) {
    const heightInMeters = update.height / 100;
    update.bmi = Math.round((update.weight / (heightInMeters * heightInMeters)) * 100) / 100;
  }
  
  next();
});

healthSchema.index({ userId: 1 });

export const Health = mongoose.model<IHealth>("Health", healthSchema);