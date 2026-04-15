import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: { userId: string };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Missing Authorization header" });

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET!) as { userId: string };
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireUser(
  req: AuthRequest
): asserts req is AuthRequest & { user: { userId: string } } {
  if (!req.user) {
    throw new Error("Unauthorized: req.user missing");
  }
}
