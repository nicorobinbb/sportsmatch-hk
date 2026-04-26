import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function supabaseAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    console.log("[Auth] Path:", req.path, "Auth header:", authHeader ? "Bearer ***" : "none");
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[Auth] No Bearer token");
      next(); // Allow unauthenticated requests
      return;
    }

    const token = authHeader.substring(7);
    console.log("[Auth] Token length:", token.length);
    
    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.log("[Auth] Verification error:", error.message);
      next();
      return;
    }
    
    if (!user) {
      console.log("[Auth] No user found");
      next();
      return;
    }

    console.log("[Auth] User authenticated:", user.id);
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (err) {
    console.log("[Auth] Exception:", err);
    next();
  }
}

// Helper to get auth context (replaces getAuth from Clerk)
export function getAuth(req: Request) {
  return {
    userId: req.user?.id,
    isAuthenticated: !!req.user,
  };
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}