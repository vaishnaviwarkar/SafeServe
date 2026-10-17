import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "safeserve_ultra_secure_jwt_secret_key_2026_production";

export interface AuthRequest extends Request {
  user?: any;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required. Please log in."
    });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists."
      });
    }

    if (user.status === "BLOCKED") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by administrators. Access to protected features is suspended."
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired session token. Please log in again."
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
}

export function requireVerified(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  // ADMIN is inherently verified
  if (req.user.role === "ADMIN") {
    return next();
  }

  if (req.user.status !== "VERIFIED") {
    return res.status(403).json({
      success: false,
      message: `Account status is '${req.user.status}'. Only VERIFIED accounts can perform this action. An administrator must approve your verification first.`
    });
  }

  next();
}

export function generateToken(payload: { id: string; email: string; role: string; status: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
