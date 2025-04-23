import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  avatar?: string;
}

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, required: false },
});

export const User = mongoose.model<IUser>("User", userSchema);
