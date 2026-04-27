import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { pool } from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'materials')

const ALLOWED_MIME = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/msword', // .doc
    'application/vnd.ms-powerpoint', // .ppt
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg'
])

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const storage = multer.diskStorage({
    destination: async (_req, _file, cb) => {
        try {
            await fs.mkdir(UPLOAD_DIR, { recursive: true })
            cb(null, UPLOAD_DIR)
        } catch (err) {
            cb(err)
        }
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().slice(0, 10)
        const randomName = `${crypto.randomUUID()}${ext}`
        cb(null, randomName)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: MAX_BYTES },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
            return cb(new Error(`Unsupported file type: ${file.mimetype}`))
        }
        cb(null, true)
    }
})

// Lazy import pdf-parse — it has a known side-effect of trying to read a test
// file on import in some environments; loading on demand avoids that.
const parsePdfText = async (filePath) => {
    try {
        const { default: pdfParse } = await import('pdf-parse')
        const buffer = await fs.readFile(filePath)
        const result = await pdfParse(buffer)
        return result.text?.trim() || null
    } catch (err) {
        console.warn('[materials] PDF parse failed:', err.message)
        return null
    }
}

const router = express.Router()

// POST /courses/:id/materials — multipart upload
router.post('/:id/materials', (req, res) => {
    upload.single('file')(req, res, async (uploadErr) => {
        if (uploadErr) {
            return res.status(400).json({ error: uploadErr.message })
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const { id: courseId } = req.params
        const title = (req.body.title || req.file.originalname).trim()
        const tags = parseTags(req.body.tags)

        let extractedText = null
        if (req.file.mimetype === 'application/pdf') {
            extractedText = await parsePdfText(req.file.path)
        }

        try {
            const result = await pool.query(
                `INSERT INTO course_items
                 (course_id, type, content, tags, status,
                  file_path, original_filename, mime_type, file_size_bytes, extracted_text)
                 VALUES ($1, 'material', $2, $3, 'incomplete', $4, $5, $6, $7, $8)
                 RETURNING *`,
                [
                    courseId,
                    title,
                    tags,
                    req.file.filename, // store only the basename; never the absolute path
                    req.file.originalname,
                    req.file.mimetype,
                    req.file.size,
                    extractedText
                ]
            )
            res.status(201).json(result.rows[0])
        } catch (dbErr) {
            // Clean up orphaned file if DB insert failed
            await fs.unlink(req.file.path).catch(() => {})
            res.status(500).json({ error: dbErr.message })
        }
    })
})

// GET /courses/materials/:itemId/download — stream the file
router.get('/materials/:itemId/download', async (req, res) => {
    const { itemId } = req.params
    try {
        const result = await pool.query(
            `SELECT file_path, original_filename, mime_type
             FROM course_items
             WHERE item_id = $1 AND type = 'material' AND file_path IS NOT NULL`,
            [itemId]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' })
        }
        const { file_path, original_filename, mime_type } = result.rows[0]

        // Resolve and confirm the file lives inside UPLOAD_DIR (defence-in-depth)
        const absolutePath = path.resolve(UPLOAD_DIR, file_path)
        if (!absolutePath.startsWith(UPLOAD_DIR)) {
            return res.status(400).json({ error: 'Invalid file path' })
        }

        res.setHeader('Content-Type', mime_type || 'application/octet-stream')
        res.setHeader(
            'Content-Disposition',
            `attachment; filename*=UTF-8''${encodeURIComponent(original_filename)}`
        )
        res.sendFile(absolutePath)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// DELETE override lives in the existing courses router (DELETE /courses/items/:itemId).
// When a material item is deleted, we also want to remove the file from disk.
// Expose a helper endpoint that cleans both, and point the frontend at it.
router.delete('/materials/:itemId', async (req, res) => {
    const { itemId } = req.params
    try {
        const existing = await pool.query(
            `SELECT file_path FROM course_items WHERE item_id = $1`,
            [itemId]
        )
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' })
        }
        const { file_path } = existing.rows[0]

        await pool.query('DELETE FROM course_items WHERE item_id = $1', [itemId])

        if (file_path) {
            const absolutePath = path.resolve(UPLOAD_DIR, file_path)
            if (absolutePath.startsWith(UPLOAD_DIR)) {
                await fs.unlink(absolutePath).catch(() => {})
            }
        }
        res.status(200).json({ message: 'Material deleted' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

const parseTags = (raw) => {
    if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean)
    if (typeof raw === 'string') {
        return raw.split(',').map((t) => t.trim()).filter(Boolean)
    }
    return []
}

export default router
