import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwtUtils";
import { SECURITY_CONFIG } from "../config/security";
import ErrorResponse from "../utils/errorResponse";
import { prisma } from "../config/prisma";

// Extend Express Request to include our user shape
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/** Reads the JWT from the HttpOnly cookie, verifies it, and attaches user to req.user */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.[SECURITY_CONFIG.COOKIES.AUTH_TOKEN];
  if (!token) return next(new ErrorResponse("Not authenticated", 401));

  const payload = verifyToken(token) as { userId: string };

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true },
  });

  if (!user) return next(new ErrorResponse("User not found", 401));

  req.user = user;
  next();
};
