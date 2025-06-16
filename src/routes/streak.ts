import { StreakController } from "@/controllers/streak/streak.controller";
import { Router } from "express";

const streakRouter = Router();
const streakController = new StreakController();

streakRouter.get("/user/:userId", streakController.getUserStreak);
streakRouter.get("/user/:userId/stats", streakController.getStreakStats);
streakRouter.post("/user/:userId/reset", streakController.resetUserStreak);
streakRouter.delete("/user/:userId", streakController.deleteUserStreak);

streakRouter.get("/top", streakController.getTopStreaks);

export { streakRouter };