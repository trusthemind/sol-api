import mongoose, { Document, Schema } from "mongoose";

export enum UserRole {
  PATIENT = "patient",
  ADMIN = "admin",
}

export interface IUser extends Document {
  email: string;
  password: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  role: UserRole;
  healthId?: mongoose.Types.ObjectId;
  createdAt?: string;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    phoneNumber: { type: String },
    bio: { type: String },
    healthId: { type: mongoose.Types.ObjectId, ref: "HealthRecord" },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PATIENT,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        delete ret.password; // optional: hide password in JSON
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
