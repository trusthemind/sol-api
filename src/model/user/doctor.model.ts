import mongoose from "mongoose";
import { IUser, UserRole } from "./user.model";

export enum Specialization {
  PSYCHIATRY = "psychiatry",
  PSYCHOLOGY = "psychology",
  CLINICAL_PSYCHOLOGY = "clinical_psychology",
  COUNSELING = "counseling",
  THERAPY = "therapy",
  MENTAL_HEALTH = "mental_health",
  BEHAVIORAL_HEALTH = "behavioral_health",
}

export interface IDoctor extends IUser {
  specialization: Specialization[];
  licenseNumber: string;
  yearsOfExperience: number;
  bio?: string;
  consultationFee?: number;
  isVerified: boolean;
  clinicName?: string;
  clinicAddress?: string;
  phoneNumber?: string;
  availableSlots?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  patients: mongoose.Types.ObjectId[];
  rating?: number;
  totalConsultations?: number;
  languages?: string[];
  education?: {
    degree: string;
    institution: string;
    year: number;
  }[];
}

const doctorSchema = new mongoose.Schema<IDoctor>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    healthId: { type: mongoose.Types.ObjectId, required: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.DOCTOR,
    },

    specialization: [
      {
        type: String,
        enum: Object.values(Specialization),
        required: true,
      },
    ],
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },
    bio: {
      type: String,
      maxlength: 1000,
    },
    consultationFee: {
      type: Number,
      min: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    clinicName: { type: String },
    clinicAddress: { type: String },
    phoneNumber: {
      type: String,
      validate: {
        validator: function (v: string) {
          return /\+?[\d\s\-\(\)]+/.test(v);
        },
        message: "Invalid phone number format",
      },
    },
    availableSlots: [
      {
        dayOfWeek: {
          type: Number,
          min: 0,
          max: 6,
        },
        startTime: {
          type: String,
          validate: {
            validator: function (v: string) {
              return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Time must be in HH:MM format",
          },
        },
        endTime: {
          type: String,
          validate: {
            validator: function (v: string) {
              return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Time must be in HH:MM format",
          },
        },
      },
    ],
    patients: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: false,
        default: [],
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    totalConsultations: {
      type: Number,
      default: 0,
    },
    languages: [
      {
        type: String,
      },
    ],
    education: [
      {
        degree: { type: String, required: true },
        institution: { type: String, required: true },
        year: { type: Number, required: true },
      },
    ],
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

doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isVerified: 1 });
doctorSchema.index({ rating: -1 });
doctorSchema.index({ "availableSlots.dayOfWeek": 1 });

doctorSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

doctorSchema.methods.addPatient = function (
  patientId: mongoose.Types.ObjectId
) {
  if (!this.patients.includes(patientId)) {
    this.patients.push(patientId);
    return this.save();
  }
  return Promise.resolve(this);
};

doctorSchema.methods.removePatient = function (
  patientId: mongoose.Types.ObjectId
) {
  this.patients = this.patients.filter(
    (id: mongoose.Types.ObjectId) => !id.equals(patientId)
  );
  return this.save();
};

doctorSchema.statics.findBySpecialization = function (
  specialization: Specialization
) {
  return this.find({
    specialization: specialization,
    isVerified: true,
  });
};
export const Doctor = mongoose.model<IDoctor>("Doctor", doctorSchema);
