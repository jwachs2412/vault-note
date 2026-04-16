import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../db';
import { RegisterRequest, LoginRequest, JWTPayload } from '../types';
import { authenticate } from '../middleware/authenticate';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

// Helper: create a JWT for a user
function createToken(userId: number, role: string): string {
  return jwt.sign({ userId, role } as JWTPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

// ─── POST /api/auth/register ────────────────────────────────────
// Create a new user account.
//
// Body: { email: "user@example.com", password: "securepassword" }
// Response: 201, { token: "eyJ...", user: { id, email, role } }
router.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as RegisterRequest;

      // ─── VALIDATION ──────────────────────────────────────────
      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      if (!password || typeof password !== 'string') {
        res.status(400).json({ error: 'Password is required' });
        return;
      }

      if (password.length < 8) {
        res
          .status(400)
          .json({ error: 'Password must be at least 8 characters' });
        return;
      }

      // ─── CHECK IF EMAIL ALREADY EXISTS ───────────────────────
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      // ─── HASH PASSWORD ──────────────────────────────────────
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // ─── INSERT USER ────────────────────────────────────────
      const result = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role, created_at',
        [email.toLowerCase(), passwordHash]
      );

      const user = result.rows[0];

      // ─── CREATE TOKEN ────────────────────────────────────────
      const token = createToken(user.id, user.role);

      res.status(201).json({ token, user });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/auth/login ───────────────────────────────────────
// Authenticate an existing user.
//
// Body: { email: "user@example.com", password: "securepassword" }
// Response: 200, { token: "eyJ...", user: { id, email, role } }
router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as LoginRequest;

      // ─── VALIDATION ──────────────────────────────────────────
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // ─── FIND USER ──────────────────────────────────────────
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [
        email.toLowerCase(),
      ]);

      if (result.rows.length === 0) {
        // Don't reveal whether the email exists or not
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const user = result.rows[0];

      // ─── VERIFY PASSWORD ────────────────────────────────────
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // ─── CREATE TOKEN ────────────────────────────────────────
      const token = createToken(user.id, user.role);

      // Send user data WITHOUT password_hash
      const { password_hash, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/auth/me ───────────────────────────────────────────
// Get the current authenticated user's info.
// Requires: valid JWT in Authorization header.
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user as JWTPayload;

      const result = await pool.query(
        'SELECT id, email, role, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

export { router as authRouter };
