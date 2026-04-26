import express from 'express'
import multer from 'multer'
import path from 'path'
import { pool } from '../config/database.js'

const router = express.Router({ mergeParams: true })

// Storage
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})
const upload = multer({ storage })

const getAssignmentItem = async (itemId) => {
    const { rows } = await pool.query(
        `SELECT * FROM course_items WHERE item_id = $1 AND type = 'assignment'`,
        [itemId]
    )
    return rows[0] ?? null
}

// GET course items/assignments

router.get('/:itemId/materials', async (req, res) => {
    const { itemId } = req.params
    const { search, tag, fileType } = req.query

    try {
        const assignment = await getAssignmentItem(itemId)
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' })
        }

        const conditions = ['m.item_id = $1']
        const values = [itemId]
        let idx = 2

        if (search) {
            conditions.push(
                `(m.title ILIKE $${idx} OR m.description ILIKE $${idx})`
            )
            values.push(`%${search}%`)
            idx++
        }

        if (tag) {
            conditions.push(
                `EXISTS (SELECT 1 FROM unnest(m.tags) AS t WHERE t ILIKE $${idx})`
            )
            values.push(`%${tag}%`)
            idx++
        }

        if (fileType) {
            conditions.push(`m.file_type = $${idx}`)
            values.push(fileType)
            idx++
        }

        const query = `
            SELECT m.*, i.content AS assignment_title
            FROM assignment_materials m
            JOIN course_items i ON i.item_id = m.item_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY m.created_at DESC, m.material_id DESC
        `

        const { rows } = await pool.query(query, values)
        res.status(200).json(rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET course materials
router.get('/:itemId/materials/:materialId', async (req, res) => {
    const { materialId } = req.params
    try {
        const { rows } = await pool.query(
            `SELECT m.*, i.content AS assignment_title
             FROM assignment_materials m
             JOIN course_items i ON i.item_id = m.item_id
             WHERE m.material_id = $1`,
            [materialId]
        )
        if (!rows.length) {
            return res.status(404).json({ error: 'Material not found' })
        }
        res.status(200).json(rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST course materials
router.post('/:itemId/materials', upload.single('file'), async (req, res) => {
    const { itemId } = req.params
    const {
        title,
        description,
        file_type,
        tags
    } = req.body

    const file_name = req.file ? req.file.originalname : req.body.file_name
    const file_url = req.file 
        ? `${req.protocol}://${req.get('host')}/public/uploads/${req.file.filename}` 
        : req.body.file_url

    if (!title || !file_name || !file_url) {
        return res.status(400).json({ error: 'Title and file (or URL) are required'})
    }

    /*const validTypes = ['syllabus', 'reading', 'slides', 'other']
    if (!validTypes.includes(file_type)) {
        return res.status(400).json({ error: `file_type must be one of: ${validTypes.join(', ')}` })
    }

    try {
        const assignment = await getAssignmentItem(itemId)
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' })
        } */

        try {
        const { rows } = await pool.query(
            `INSERT INTO assignment_materials 
                (item_id, title, description, file_name, file_url, file_type, tags)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [itemId, title, description, file_name, file_url, file_type, tags.split(',')]
        )
        res.status(201).json(rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})


// Update title, description, file type, or tags.
router.patch('/:itemId/materials/:materialId', async (req, res) => {
    const { materialId } = req.params
    const { title, description, file_type, tags } = req.body

    try {
        const { rows } = await pool.query(
            `UPDATE assignment_materials
             SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                file_type = COALESCE($3, file_type),
                tags = COALESCE($4, tags) WHERE material_id = $5 RETURNING *`,
            [title ?? null, description ?? null, file_type ?? null, tags ?? null, materialId]
        )
        if (!rows.length) {
            return res.status(404).json({ error: 'Material not found' })
        }
        res.status(200).json(rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// DELETE course materials
router.delete('/:itemId/materials/:materialId', async (req, res) => {
    const { materialId } = req.params
    try {
        const { rows } = await pool.query(
            'DELETE FROM assignment_materials WHERE material_id = $1 RETURNING material_id',
            [materialId]
        )
        if (!rows.length) {
            return res.status(404).json({ error: 'Material not found' })
        }
        res.status(200).json({ message: 'Material deleted' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router