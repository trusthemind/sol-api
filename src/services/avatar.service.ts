import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import Logger from "@/utils/logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export class AvatarService {
  private readonly logger = new Logger();
  async uploadAvatar(
    file: Express.Multer.File,
    userId: string
  ): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "avatars",
            public_id: `avatar_${userId}`,
            transformation: [
              { width: 200, height: 200, crop: "fill", gravity: "face" },
              { quality: "auto", fetch_format: "auto" },
            ],
            overwrite: true,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result!.secure_url);
            }
          }
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      throw new Error(
        `Avatar upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteAvatar(userId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(`avatars/avatar_${userId}`);
    } catch (error) {
      this.logger.error("Error deleting avatar:", error);
    }
  }
}
