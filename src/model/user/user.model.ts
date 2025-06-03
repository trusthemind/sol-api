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
  doctorId?: mongoose.Types.ObjectId;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, required: false },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    healthId: { type: mongoose.Types.ObjectId, required: false },
    doctorId: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Doctor",
        required: false,
        default: [],
      },
    ],
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
