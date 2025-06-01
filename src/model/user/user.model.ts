import mongoose, { Document } from "mongoose";

export enum UserRole {
  PATIENT = "patient",
  DOCTOR = "doctor",
}

export interface IUser extends Document {
  email: string;
  password: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  healthId?: string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, required: false },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    healthId: { type: mongoose.Types.ObjectId, required: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.PATIENT,
    },
  },
  {
    toJSON: {
      transform: function (d, v) {
        delete v.__v;
        return v;
      },
    },
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
