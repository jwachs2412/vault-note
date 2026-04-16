import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

/**
 * Authentication middleware.
 *
 * Expects: Authorization: Bearer <token> in request headers.
 *
 * If valid:   Attaches req.user = { userId, role } and calls next()
 * If invalid: Sends 401 Unauthorized
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // 1. Get the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  // 2. Extract the token (everything after "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verify the token signature and decode the payload
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // 4. Attach the user data to the request object
    (req as any).user = payload;

    // 5. Continue to the route handler
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Authorization middleware for admin-only routes.
 * Must be used AFTER authenticate middleware.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as JWTPayload;

  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}
