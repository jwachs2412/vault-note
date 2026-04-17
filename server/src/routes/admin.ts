import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db';
import { authenticate, requireAdmin } from '../middleware/authenticate';

const router = Router();

// Both middleware run in order: first authenticate, then check admin role
router.use(authenticate);
router.use(requireAdmin);

// ─── GET /api/admin/stats ───────────────────────────────────────
// Returns usage statistics. Admin only.
router.get(
  '/stats',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      const noteCount = await pool.query('SELECT COUNT(*) FROM notes');
      const notesPerUser = await pool.query(`
      SELECT u.email, COUNT(n.id) as note_count
      FROM users u
      LEFT JOIN notes n ON u.id = n.user_id
      GROUP BY u.id, u.email
      ORDER BY note_count DESC
    `);

      res.json({
        totalUsers: parseInt(userCount.rows[0].count),
        totalNotes: parseInt(noteCount.rows[0].count),
        notesPerUser: notesPerUser.rows,
      });
    } catch (err) {
      next(err);
    }
  }
);

export { router as adminRouter };
