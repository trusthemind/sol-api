import mongoose, { Document, Schema } from "mongoose";

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
  phoneNumber?: string;
  bio?: string;
  role: UserRole;
  healthId?: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId[];
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
    },
    bio: {
      type: String,
    },
    healthId: {
      type: Schema.Types.ObjectId,
      ref: "Health",
    },
    doctorId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Doctor",
        default: [],
      },
    ],
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PATIENT,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
