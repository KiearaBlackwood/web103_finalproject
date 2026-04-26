import express from 'express'
import dotenv from 'dotenv'
import coursesRouter from './routes/courses.js'
import assignmentMaterialsRouter from './routes/assignmentMaterials.js'
import { fileURLToPath } from 'url' 
import path from 'path'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

const app = express()

app.use(express.json())
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
	res.header('Access-Control-Allow-Headers', 'Content-Type')

	if (req.method === 'OPTIONS') {
		return res.sendStatus(204)
	}

	next()
})

app.use('/public', express.static('./public'))
app.use('/courses', coursesRouter)
app.use('/courses/items/assignments', assignmentMaterialsRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`))
