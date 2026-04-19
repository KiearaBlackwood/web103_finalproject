import { pool } from './database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import courseData from '../data/course.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
    due_date TIMESTAMP

`;