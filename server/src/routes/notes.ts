import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db';
import { CreateNoteRequest, UpdateNoteRequest, JWTPayload } from '../types';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All routes in this file require authentication
router.use(authenticate);

// ─── GET /api/notes ─────────────────────────────────────────────
// List all notes for the authenticated user.
//
// The key line: WHERE user_id = $1 - scoped to THIS user only.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = (req as any).user as JWTPayload;

    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/notes ────────────────────────────────────────────
// Create a new note for the authenticated user.
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = (req as any).user as JWTPayload;
    const { title, content } = req.body as CreateNoteRequest;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Note title is required' });
      return;
    }

    if (title.trim().length > 200) {
      res.status(400).json({ error: 'Title must be 200 characters or fewer' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, title.trim(), content?.trim() || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/notes/:id ─────────────────────────────────────────
// Get a single note. Must belong to the authenticated user.
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = (req as any).user as JWTPayload;
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/notes/:id ─────────────────────────────────────────
// Update a note. Must belong to the authenticated user.
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = (req as any).user as JWTPayload;
    const { id } = req.params;
    const { title, content } = req.body as UpdateNoteRequest;

    if (title === undefined && content === undefined) {
      res
        .status(400)
        .json({ error: 'At least one field (title or content) is required' });
      return;
    }

    if (
      title !== undefined &&
      (typeof title !== 'string' || title.trim().length === 0)
    ) {
      res.status(400).json({ error: 'Title cannot be empty' });
      return;
    }

    if (title !== undefined && title.trim().length > 200) {
      res.status(400).json({ error: 'Title must be 200 characters or fewer' });
      return;
    }

    // Build dynamic UPDATE query
    const fields: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }
    if (content !== undefined) {
      fields.push(`content = $${paramIndex++}`);
      values.push(content.trim());
    }
    fields.push(`updated_at = NOW()`);

    // WHERE id = $N AND user_id = $N+1
    values.push(Number(id));
    const idParam = paramIndex++;
    values.push(userId);
    const userParam = paramIndex;

    const result = await pool.query(
      `UPDATE notes SET ${fields.join(', ')} WHERE id = $${idParam} AND user_id = $${userParam} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/notes/:id ──────────────────────────────────────
// Delete a note. Must belong to the authenticated user.
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user as JWTPayload;
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Note not found' });
        return;
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export { router as notesRouter };
