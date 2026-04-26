import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// GET all courses
router.get('/', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM courses ORDER BY course_id ASC');
        res.status(200).json(results.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all course items with optional filters and sorting
router.get('/items', async (req, res) => {
    const { courseId, type, status, tag, sortBy = 'date', sortOrder = 'desc' } = req.query;
    const conditions = [];
    const values = [];

    if (courseId) {
        values.push(courseId);
        conditions.push(`c.course_id = $${values.length}`);
    }

    if (type) {
        values.push(type);
        conditions.push(`i.type = $${values.length}`);
    }

    if (status) {
        values.push(status);
        conditions.push(`i.status = $${values.length}`);
    }

    if (tag) {
        values.push(tag);
        conditions.push(`EXISTS (SELECT 1 FROM unnest(i.tags) AS item_tag WHERE item_tag ILIKE '%' || $${values.length} || '%')`);
    }

    const sortMap = {
        course: 'c.title',
        date: 'i.created_at',
        tags: "COALESCE(array_to_string(i.tags, ', '), '')",
        status: 'i.status'
    };

    const sortColumn = sortMap[sortBy] || sortMap.date;
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';

    try {
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const query = `
            SELECT
                i.*,
                c.title AS course_title,
                c.course_id AS course_id
            FROM course_items i
            JOIN courses c ON c.course_id = i.course_id
            ${whereClause}
            ORDER BY ${sortColumn} ${direction}, i.item_id DESC
        `;

        const results = await pool.query(query, values);
        res.status(200).json(results.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET specific course with its items (Notes, Materials, etc.)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const course = await pool.query('SELECT * FROM courses WHERE course_id = $1', [id]);
        const items = await pool.query('SELECT * FROM course_items WHERE course_id = $1 ORDER BY created_at DESC, item_id DESC', [id]);
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
            'UPDATE courses SET title = $1, description = $2 WHERE course_id = $3 RETURNING *',
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
        await pool.query('DELETE FROM courses WHERE course_id = $1', [id]);
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new item (note, material, or assignment) to a course
router.post('/:id/items', async (req, res) => {
    const { id } = req.params;
    const { type, content, due_date = null, tags = [], status = 'incomplete' } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO course_items (course_id, type, content, due_date, tags, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, type, content, due_date, tags, status]
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
        await pool.query('DELETE FROM course_items WHERE item_id = $1', [itemId]);
        res.status(200).json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
