import jwt from "jsonwebtoken";
import { SECURITY_CONFIG } from "../config/security";

// Generate a JWT for a user session
export const generateToken = (userId: string) =>
  jwt.sign({ userId }, SECURITY_CONFIG.JWT_OPTIONS.SECRET!, {
    expiresIn: SECURITY_CONFIG.JWT_OPTIONS.EXPIRY as any,
  });

// verify token
export const verifyToken = (token: string) =>
  jwt.verify(token, SECURITY_CONFIG.JWT_OPTIONS.SECRET!);
