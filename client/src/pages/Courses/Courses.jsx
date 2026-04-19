import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { coursesApi } from '../../api/coursesApi'
import './Courses.css'

const Courses = () => {
    const { courseId } = useParams()
    const location = useLocation()
    const selectedCourse = location.state?.course

    const [course, setCourse] = useState(selectedCourse || null)
    const [notes, setNotes] = useState([])
    const [materials, setMaterials] = useState([])
    const [assignments, setAssignments] = useState([])
    const [error, setError] = useState('')

    const loadCourse = async () => {
        try {
            setError('')
            const data = await coursesApi.getById(courseId)
            setCourse(data)

            const items = data.items || []
            setNotes(items.filter((item) => item.type === 'note'))
            setMaterials(items.filter((item) => item.type === 'material'))
            setAssignments(items.filter((item) => item.type === 'assignment'))
        } catch (err) {
            setError(err.message)
        }
    }

    useEffect(() => {
        loadCourse()
    }, [courseId])

    const addItem = async (type) => {
        const value = window.prompt(`Add a new ${type}:`)

        if (!value || !value.trim()) {
            return
        }

        try {
            setError('')
            await coursesApi.addItem(courseId, {
                type,
                content: value.trim()
            })
            await loadCourse()
        } catch (err) {
            setError(err.message)
        }
    }

    const deleteItem = async (itemId) => {
        if (!window.confirm('Delete this item?')) {
            return
        }

        try {
            setError('')
            await coursesApi.removeItem(itemId)
            await loadCourse()
        } catch (err) {
            setError(err.message)
        }
    }

    const renderItems = (items) => {
        return items.map((item) => (
            <li key={item.item_id} className="item-card">
                <span>{item.content}</span>
                <button type="button" className="delete-btn" onClick={() => deleteItem(item.item_id)}>
                    ×
                </button>
            </li>
        ))
    }

    const courseTitle = course?.title || `Course #${courseId}`
    const courseDescription = course?.description || 'Course description is not available yet.'

    return (
        <div id="app">
            <header className="course-header">
                <Link to="/">← Back to Dashboard</Link>
                <h1 id="course-title">{courseTitle}</h1>
                <p id="course-description">{courseDescription}</p>
            </header>

            {error ? <p style={{ padding: '0 20px', color: '#d00' }}>{error}</p> : null}

            <main className="course-organizer">
                <section className="column" id="notes-section">
                    <div className="column-header">
                        <h2>Notes</h2>
                        <button type="button" onClick={() => addItem('note')}>+</button>
                    </div>
                    <ul id="notes-list" className="item-list">
                        {renderItems(notes)}
                    </ul>
                </section>

                <section className="column" id="materials-section">
                    <div className="column-header">
                        <h2>Materials</h2>
                        <button type="button" onClick={() => addItem('material')}>+</button>
                    </div>
                    <ul id="materials-list" className="item-list">
                        {renderItems(materials)}
                    </ul>
                </section>

                <section className="column" id="assignments-section">
                    <div className="column-header">
                        <h2>Assignments</h2>
                        <button type="button" onClick={() => addItem('assignment')}>+</button>
                    </div>
                    <ul id="assignments-list" className="item-list">
                        {renderItems(assignments)}
                    </ul>
                </section>
            </main>
        </div>
    )
}

export default Courses
