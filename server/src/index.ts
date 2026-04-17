import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import pool from './db';
import { authRouter } from './routes/auth';
import { notesRouter } from './routes/notes';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ─────────────────────────────────────────────────
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));

// ─── ROUTES ─────────────────────────────────────────────────────
app.use('/api/auth', authRouter); // Public: register, login
app.use('/api/notes', notesRouter); // Protected: CRUD for notes
app.use('/api/admin', adminRouter); // Protected + Admin: stats

// ─── HEALTH CHECK ───────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: result.rows[0].now,
    });
  } catch {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// ─── ERROR HANDLER ──────────────────────────────────────────────
app.use(errorHandler);

// ─── START SERVER ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
