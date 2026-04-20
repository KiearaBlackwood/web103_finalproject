import { pool } from './database.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import userData from '../data/users.js'
import courseData from '../data/course.js'
import courseItemsData from '../data/courseItems.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const dropTables = async () => {
    const dropTablesQuery = `
        DROP TABLE IF EXISTS course_items CASCADE;
        DROP TABLE IF EXISTS courses CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
    `

    try {
        await pool.query(dropTablesQuery)
        console.log('✅ Tables dropped successfully')
    } catch (err) {
        console.error('⚠️ Error dropping tables:', err)
    }
}

const createTables = async () => {
    const createTablesQuery = `
        CREATE TABLE users (
            user_id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        );

        CREATE TABLE courses (
            course_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT
        );

        CREATE TABLE course_items (
            item_id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
            type TEXT CHECK (type IN ('note', 'material', 'assignment')),
            content TEXT NOT NULL,
            due_date TIMESTAMP,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            tags TEXT[] NOT NULL DEFAULT '{}',
            status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('complete', 'incomplete'))
        );
    `

    try {
        await pool.query(createTablesQuery)
        console.log('🎉 Tables created successfully')
    } catch (err) {
        console.error('⚠️ Error creating tables:', err)
    }
}

const seedUsers = async () => {
    try {
        for (const user of userData) {
            const insertQuery = {
                text: 'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
                values: [user.name, user.email, user.password_hash]
            }
            await pool.query(insertQuery)
        }
        console.log(`✅ ${userData.length} users seeded successfully`)
    } catch (err) {
        console.error('⚠️ Error seeding users:', err)
    }
}

const seedCourses = async () => {
    try {
        for (const course of courseData) {
            const insertQuery = {
                text: 'INSERT INTO courses (user_id, title, description) VALUES ($1, $2, $3)',
                values: [course.user_id, course.title, course.description]
            }
            await pool.query(insertQuery)
        }
        console.log(`✅ ${courseData.length} courses seeded successfully`)
    } catch (err) {
        console.error('⚠️ Error seeding courses:', err)
    }
}

const seedCourseItems = async () => {
    try {
        for (const item of courseItemsData) {
            const insertQuery = {
                text: 'INSERT INTO course_items (course_id, type, content, due_date, created_at, tags, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                values: [item.course_id, item.type, item.content, item.due_date, item.created_at, item.tags, item.status]
            }
            await pool.query(insertQuery)
        }
        console.log(`✅ ${courseItemsData.length} course items seeded successfully`)
    } catch (err) {
        console.error('⚠️ Error seeding course items:', err)
    }
}

const seedTables = async () => {
    await dropTables()
    await createTables()
    await seedUsers()
    await seedCourses()
    await seedCourseItems()
    console.log('🌱 Database reset and seeded successfully!')
    process.exit(0)
}

seedTables()