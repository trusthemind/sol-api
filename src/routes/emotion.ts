import { EmotionController } from "@/controllers/emotion/emotion.controller";
import { Router } from "express";

const emotionRouter = Router();
const emotionController = new EmotionController();

emotionRouter.post("/", emotionController.createEmotion);
emotionRouter.get("/", emotionController.getAllEmotions);
emotionRouter.get("/search", emotionController.searchEmotions);

emotionRouter.get(
  "/user/:userId/timerange/:timeRange",
  emotionController.getEmotionsByTimeRange
);
emotionRouter.get("/user/:userId/stats", emotionController.getEmotionStats);
emotionRouter.get(
  "/user/:userId/patterns",
  emotionController.getEmotionPatterns
);
emotionRouter.get(
  "/user/:userId/analysis",
  emotionController.getEmotionAnalysis
);
emotionRouter.get(
  "/user/:userId/recommendations",
  emotionController.getRecommendations
);
emotionRouter.get("/user/:userId/summary", emotionController.getOverallSummary);

emotionRouter.get("/:id", emotionController.getEmotionById);
emotionRouter.put("/:id", emotionController.updateEmotion);
emotionRouter.delete("/:id", emotionController.deleteEmotion);

export { emotionRouter };
