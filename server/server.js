import express from 'express'
import pg from 'pg'
import dotenv from 'dotenv'
import coursesRouter from './routes/courses.js'
import { fileURLToPath } from 'url' 

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

const app = express()

app.use('/public', express.static('./public'))
app.use('/courses', coursesRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`))