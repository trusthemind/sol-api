import { EmotionAIController } from "@/controllers/emotion/emotion.ai.controller";
import { EmotionController } from "@/controllers/emotion/emotion.controller";
import { Router } from "express";

const emotionRouter = Router();
const emotionController = new EmotionController();
const emotionAIController = new EmotionAIController();

emotionRouter.post("/", emotionController.createEmotion);
emotionRouter.get("/", emotionController.getAllEmotions);
emotionRouter.get("/search", emotionController.searchEmotions);
emotionRouter.get("/:id", emotionController.getEmotionById);
emotionRouter.put("/:id", emotionController.updateEmotion);
emotionRouter.delete("/:id", emotionController.deleteEmotion);

emotionRouter.get(
  "/user/:userId/timerange/:timeRange",
  emotionController.getEmotionsByTimeRange
);

emotionRouter.get(
  "/user/:userId/analysis",
  emotionAIController.getEmotionAnalysis
);
emotionRouter.get(
  "/user/:userId/recommendations",
  emotionAIController.getRecommendations
);
emotionRouter.post(
  "/recommendations/instant",
  emotionAIController.generateInstantRecommendation
);
emotionRouter.get(
  "/user/:userId/summary", 
  emotionAIController.getOverallSummary
);

export { emotionRouter };