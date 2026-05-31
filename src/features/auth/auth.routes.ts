import { Router } from "express";
import {
  redirectToGoogle,
  googleCallback,
  getMe,
  logout,
} from "./auth.controller";
import { protect } from "../../middleware/auth.middleware";

const authRouter = Router();

// /api/v1/auth/google
authRouter.get("/google", redirectToGoogle);

// /api/v1/auth/google/callback
authRouter.get("/google/callback", googleCallback);

// /api/v1/auth/me
authRouter.get("/me", protect, getMe);

// /api/v1/auth/logout
authRouter.post("/logout", logout);

export default authRouter;
