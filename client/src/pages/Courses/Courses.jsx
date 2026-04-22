import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { coursesApi } from '../../api/coursesApi'
import AssignmentModal from '../../components/AssignmentModal/AssignmentModal'
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

    // Assignment modal state — null = closed, object = editing, 'new' = creating
    const [modalTarget, setModalTarget] = useState(null)

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

    useEffect(() => { loadCourse() }, [courseId])

    // --- Notes & Materials: keep prompt-based (unchanged behaviour) ---
    const addSimpleItem = async (type) => {
        const value = window.prompt(`Add a new ${type}:`)
        if (!value?.trim()) return

        const tagsInput = window.prompt('Optional tags (comma separated):', '') || ''
        const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)

        try {
            setError('')
            await coursesApi.addItem(courseId, { type, content: value.trim(), tags, status: 'incomplete' })
            await loadCourse()
        } catch (err) {
            setError(err.message)
        }
    }

    // --- Assignment modal handlers ---
    const handleAssignmentSubmit = async (formData) => {
        try {
            setError('')
            if (modalTarget === 'new') {
                await coursesApi.addItem(courseId, { type: 'assignment', ...formData })
            } else {
                await coursesApi.updateItem(modalTarget.item_id, formData)
            }
            setModalTarget(null)
            await loadCourse()
        } catch (err) {
            setError(err.message)
        }
    }

    const toggleComplete = async (item) => {
        try {
            setError('')
            await coursesApi.updateItem(item.item_id, {
                status: item.status === 'complete' ? 'incomplete' : 'complete'
            })
            await loadCourse()
        } catch (err) {
            setError(err.message)
        }
    }

    const deleteItem = async (itemId) => {
        if (!window.confirm('Delete this item?')) return
        try {
            setError('')
            await coursesApi.removeItem(itemId)
            await loadCourse()
        } catch (err) {
            setError(err.message)
        }
    }

    const renderSimpleItems = (items) =>
        items.map((item) => (
            <li key={item.item_id} className="item-card">
                <div className="item-details">
                    <span className="item-content">{item.content}</span>
                    <div className="item-meta">
                        <span>{item.status}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="item-tags">
                        {(item.tags || []).length > 0
                            ? item.tags.map((tag) => <span key={tag}>{tag}</span>)
                            : <span>No tags</span>}
                    </div>
                </div>
                <button type="button" className="delete-btn" aria-label="Delete item" onClick={() => deleteItem(item.item_id)}>
                    ×
                </button>
            </li>
        ))

    const renderAssignments = (items) =>
        items.map((item) => (
            <li
                key={item.item_id}
                className={`item-card item-card--assignment${item.status === 'complete' ? ' item-card--complete' : ''}`}
            >
                <div className="item-details">
                    <span className="item-content">{item.content}</span>
                    <div className="item-meta">
                        {item.due_date && (
                            <span className={isOverdue(item) ? 'meta-overdue' : ''}>
                                Due {new Date(item.due_date).toLocaleDateString()}
                            </span>
                        )}
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="item-tags">
                        {(item.tags || []).length > 0
                            ? item.tags.map((tag) => <span key={tag}>{tag}</span>)
                            : <span>No tags</span>}
                    </div>
                </div>
                <div className="item-actions">
                    <button
                        type="button"
                        className={`toggle-btn${item.status === 'complete' ? ' toggle-btn--done' : ''}`}
                        aria-label={item.status === 'complete' ? 'Mark incomplete' : 'Mark complete'}
                        aria-pressed={item.status === 'complete'}
                        onClick={() => toggleComplete(item)}
                    >
                        {item.status === 'complete' ? '✓' : '○'}
                    </button>
                    <button
                        type="button"
                        className="edit-btn"
                        aria-label="Edit assignment"
                        onClick={() => setModalTarget(item)}
                    >
                        ✎
                    </button>
                    <button
                        type="button"
                        className="delete-btn"
                        aria-label="Delete assignment"
                        onClick={() => deleteItem(item.item_id)}
                    >
                        ×
                    </button>
                </div>
            </li>
        ))

    const completedCount = assignments.filter((a) => a.status === 'complete').length
    const totalCount = assignments.length
    const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

    const courseTitle = course?.title || `Course #${courseId}`
    const courseDescription = course?.description || 'Course description is not available yet.'

    return (
        <div id="app">
            <header className="course-header">
                <Link to="/">← Back to Dashboard</Link>
                <h1 id="course-title">{courseTitle}</h1>
                <p id="course-description">{courseDescription}</p>
            </header>

            {error && <p className="page-error" role="alert">{error}</p>}

            <main className="course-organizer">
                <section className="column" id="notes-section">
                    <div className="column-header">
                        <h2>Notes</h2>
                        <button type="button" aria-label="Add note" onClick={() => addSimpleItem('note')}>+</button>
                    </div>
                    <ul id="notes-list" className="item-list">
                        {renderSimpleItems(notes)}
                    </ul>
                </section>

                <section className="column" id="materials-section">
                    <div className="column-header">
                        <h2>Materials</h2>
                        <button type="button" aria-label="Add material" onClick={() => addSimpleItem('material')}>+</button>
                    </div>
                    <ul id="materials-list" className="item-list">
                        {renderSimpleItems(materials)}
                    </ul>
                </section>

                <section className="column" id="assignments-section">
                    <div className="column-header">
                        <h2>Assignments</h2>
                        <button
                            type="button"
                            aria-label="Add assignment"
                            onClick={() => setModalTarget('new')}
                        >
                            +
                        </button>
                    </div>

                    {totalCount > 0 && (
                        <div className="progress-wrap" aria-label={`${completedCount} of ${totalCount} assignments complete`}>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className="progress-label">{completedCount}/{totalCount} complete</span>
                        </div>
                    )}

                    <ul id="assignments-list" className="item-list">
                        {renderAssignments(assignments)}
                    </ul>
                </section>
            </main>

            <AssignmentModal
                isOpen={modalTarget !== null}
                onClose={() => setModalTarget(null)}
                onSubmit={handleAssignmentSubmit}
                initial={modalTarget !== 'new' ? modalTarget : null}
            />
        </div>
    )
}

const isOverdue = (item) => {
    if (!item.due_date || item.status === 'complete') return false
    return new Date(item.due_date) < new Date()
}

export default Courses
