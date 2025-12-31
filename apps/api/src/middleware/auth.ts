import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { MunicipalityUser, PlatformMaintainer } from "../models/index.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    municipalityId?: string;
    role: "municipality_user" | "platform_maintainer";
    userRole?: "admin" | "officer" | "viewer";
  };
}

interface JwtPayload {
  id: string;
  municipalityId?: string;
  role: "municipality_user" | "platform_maintainer";
  userRole?: "admin" | "officer" | "viewer";
}

export const authenticateMunicipality = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    if (decoded.role !== "municipality_user") {
      res
        .status(403)
        .json({ error: "Access denied. Municipality user required." });
      return;
    }

    // Verify user still exists and is active
    const user = await MunicipalityUser.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }

    req.user = {
      id: decoded.id,
      municipalityId: decoded.municipalityId,
      role: decoded.role,
      userRole: decoded.userRole,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    next(error);
  }
};

export const authenticatePlatformMaintainer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    if (decoded.role !== "platform_maintainer") {
      res
        .status(403)
        .json({ error: "Access denied. Platform maintainer required." });
      return;
    }

    // Verify maintainer still exists and is active
    const maintainer = await PlatformMaintainer.findById(decoded.id);
    if (!maintainer || !maintainer.isActive) {
      res.status(401).json({ error: "Maintainer not found or inactive" });
      return;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    req.user = {
      id: decoded.id,
      municipalityId: decoded.municipalityId,
      role: decoded.role,
      userRole: decoded.userRole,
    };

    next();
  } catch {
    // Token invalid, continue without auth
    next();
  }
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
};
