import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// GET all courses
router.get('/', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM courses ORDER BY id ASC');
        res.status(200).json(results.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET specific course with its items (Notes, Materials, etc.)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const course = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
        const items = await pool.query('SELECT * FROM course_items WHERE course_id = $1', [id]);
        res.status(200).json({ ...course.rows[0], items: items.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE a course
router.post('/', async (req, res) => {
    const { title, user_id, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO courses (title, user_id, description) VALUES ($1, $2, $3) RETURNING *',
            [title, user_id, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE a course
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    try {
        const result = await pool.query(
            'UPDATE courses SET title = $1, description = $2 WHERE id = $3 RETURNING *',
            [title, description, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a course
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM courses WHERE id = $1', [id]);
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new item (note, material, or assignment) to a course
router.post('/:id/items', async (req, res) => {
    const { id } = req.params;
    const { type, content } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO course_items (course_id, type, content) VALUES ($1, $2, $3) RETURNING *',
            [id, type, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a specific item
router.delete('/items/:itemId', async (req, res) => {
    const { itemId } = req.params;
    try {
        await pool.query('DELETE FROM course_items WHERE id = $1', [itemId]);
        res.status(200).json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;