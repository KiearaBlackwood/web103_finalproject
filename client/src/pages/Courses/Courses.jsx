import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { coursesApi } from '../../api/coursesApi'
import AssignmentMaterials from '../../components/AssignmentMaterials/AssignmentMaterials'
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

        const tagsInput = window.prompt('Optional tags (comma separated):', '') || ''
        const statusInput = window.prompt('Status (complete or incomplete):', 'incomplete') || 'incomplete'
        const dueDateInput = type === 'assignment'
            ? window.prompt('Optional due date (YYYY-MM-DD or ISO string):', '') || ''
            : ''

        const tags = tagsInput
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)

        const normalizedStatus = statusInput.trim().toLowerCase() === 'complete' ? 'complete' : 'incomplete'
        const normalizedDueDate = dueDateInput.trim() || null

        try {
            setError('')
            await coursesApi.addItem(courseId, {
                type,
                content: value.trim(),
                tags,
                status: normalizedStatus,
                due_date: normalizedDueDate
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

    // Notes and materials render 
    const renderBasicItems = (items) => {
        return items.map((item) => (
            <li key={item.item_id} className="item-card">
                <div className="item-details">
                    <span className="item-content">{item.content}</span>
                    <div className="item-meta">
                        <span>{item.status}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        {item.due_date ? <span>Due {new Date(item.due_date).toLocaleDateString()}</span> : null}
                    </div>
                    <div className="item-tags">
                        {(item.tags || []).length > 0 ? item.tags.map((itemTag) => (
                            <span key={itemTag}>{itemTag}</span>
                        )) : <span>No tags</span>}
                    </div>
                </div>
                <button type="button" className="delete-btn" onClick={() => deleteItem(item.item_id)}>
                    ×
                </button>
            </li>
        ))
    }

    // Assignments render with the Course Material Library
    const renderAssignmentItems = (items) => {
        return items.map((item) => (
            <li key={item.item_id} className="item-card item-card--assignment">
                <div className="item-details" style={{ flex: 1 }}>
                    <span className="item-content">{item.content}</span>
                    <div className="item-meta">
                        <span>{item.status}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        {item.due_date ? <span>Due {new Date(item.due_date).toLocaleDateString()}</span> : null}
                    </div>
                    <div className="item-tags">
                        {(item.tags || []).length > 0 ? item.tags.map((itemTag) => (
                            <span key={itemTag}>{itemTag}</span>
                        )) : <span>No tags</span>}
                    </div>

                    {/* ── Course Material Library ── */}
                    <AssignmentMaterials itemId={item.item_id} />
                </div>
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
                        {renderBasicItems(notes)}
                    </ul>
                </section>

                <section className="column" id="materials-section">
                    <div className="column-header">
                        <h2>Materials</h2>
                        <button type="button" onClick={() => addItem('material')}>+</button>
                    </div>
                    <ul id="materials-list" className="item-list">
                        {renderBasicItems(materials)}
                    </ul>
                </section>

                <section className="column" id="assignments-section">
                    <div className="column-header">
                        <h2>Assignments</h2>
                        <button type="button" onClick={() => addItem('assignment')}>+</button>
                    </div>
                    <ul id="assignments-list" className="item-list">
                        {renderAssignmentItems(assignments)}
                    </ul>
                </section>
            </main>
        </div>
    )
}

export default Courses
