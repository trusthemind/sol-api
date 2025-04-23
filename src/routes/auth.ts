import { Router } from "express";
import { AuthController } from "@/controllers/auth/auth.controller";

const AuthRoutes = Router();
const controller = new AuthController();

AuthRoutes.post("/registration", controller.register.bind(controller));
AuthRoutes.post("/login", controller.login.bind(controller));
export default AuthRoutes;
