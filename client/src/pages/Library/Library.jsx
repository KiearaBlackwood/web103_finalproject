import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { coursesApi } from '../../api/coursesApi'
import './Library.css'

const Library = () => {
    const [courses, setCourses] = useState([])
    const [items, setItems] = useState([])
    const [courseId, setCourseId] = useState('')
    const [type, setType] = useState('')
    const [status, setStatus] = useState('')
    const [tag, setTag] = useState('')
    const [sortBy, setSortBy] = useState('date')
    const [sortOrder, setSortOrder] = useState('desc')
    const [error, setError] = useState('')

    const loadCourses = async () => {
        try {
            const data = await coursesApi.getAll()
            setCourses(data)
        } catch (err) {
            setError(err.message)
        }
    }

    const loadItems = async () => {
        try {
            setError('')
            const data = await coursesApi.getItems({
                courseId,
                type,
                status,
                tag,
                sortBy,
                sortOrder
            })
            setItems(data)
        } catch (err) {
            setError(err.message)
        }
    }

    useEffect(() => {
        loadCourses()
    }, [])

    useEffect(() => {
        loadItems()
    }, [courseId, type, status, tag, sortBy, sortOrder])

    const sortOrderLabel = useMemo(() => {
        if (sortBy === 'course') {
            return sortOrder === 'asc' ? 'A-Z' : 'Z-A'
        }

        if (sortBy === 'tags') {
            return sortOrder === 'asc' ? 'A-Z' : 'Z-A'
        }

        if (sortBy === 'status') {
            return sortOrder === 'asc' ? 'Complete first' : 'Incomplete first'
        }

        return sortOrder === 'asc' ? 'Oldest first' : 'Newest first'
    }, [sortBy, sortOrder])

    const formatDate = (value) => {
        if (!value) {
            return 'No date available'
        }

        return new Date(value).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const resetFilters = () => {
        setCourseId('')
        setType('')
        setStatus('')
        setTag('')
        setSortBy('date')
        setSortOrder('desc')
    }

    return (
        <div className="library-page" id="app">
            <header className="library-header">
                <div>
                    <Link to="/">← Back to Dashboard</Link>
                    <h1>Course Library</h1>
                    <p>Filter and sort notes, materials, and assignments across all of your courses.</p>
                </div>
                <button type="button" className="library-reset" onClick={resetFilters}>
                    Reset Filters
                </button>
            </header>

            <section className="library-controls">
                <label>
                    Course
                    <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                        <option value="">All courses</option>
                        {courses.map((course) => (
                            <option key={course.course_id} value={course.course_id}>
                                {course.title}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Type
                    <select value={type} onChange={(event) => setType(event.target.value)}>
                        <option value="">All types</option>
                        <option value="note">Notes</option>
                        <option value="material">Materials</option>
                        <option value="assignment">Assignments</option>
                    </select>
                </label>

                <label>
                    Status
                    <select value={status} onChange={(event) => setStatus(event.target.value)}>
                        <option value="">All statuses</option>
                        <option value="complete">Complete</option>
                        <option value="incomplete">Incomplete</option>
                    </select>
                </label>

                <label>
                    Tag
                    <input
                        type="text"
                        value={tag}
                        onChange={(event) => setTag(event.target.value)}
                        placeholder="Search tags"
                    />
                </label>

                <label>
                    Sort By
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                        <option value="date">Date</option>
                        <option value="course">Course</option>
                        <option value="tags">Tags</option>
                        <option value="status">Status</option>
                    </select>
                </label>

                <label>
                    Order
                    <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                        <option value="desc">{sortOrderLabel}</option>
                        <option value="asc">
                            {sortBy === 'status'
                                ? 'Complete first'
                                : sortBy === 'course' || sortBy === 'tags'
                                    ? 'A-Z'
                                    : 'Oldest first'}
                        </option>
                    </select>
                </label>
            </section>

            {error ? <p className="library-error">{error}</p> : null}

            <main className="library-grid">
                {items.length === 0 ? (
                    <div className="library-empty">No items match the current filters.</div>
                ) : (
                    items.map((item) => (
                        <article key={item.item_id} className={`library-card type-${item.type}`}>
                            <div className="library-card-top">
                                <span className="library-course">{item.course_title}</span>
                                <Link to={`/courses/${item.course_id}`}>Open course</Link>
                            </div>
                            <h2>{item.content}</h2>
                            <div className="library-meta">
                                <span>{item.type}</span>
                                <span>{item.status}</span>
                                <span>{formatDate(item.created_at)}</span>
                                {item.due_date ? <span>Due {formatDate(item.due_date)}</span> : null}
                            </div>
                            <div className="library-tags">
                                {(item.tags || []).length > 0 ? item.tags.map((itemTag) => (
                                    <span key={itemTag}>{itemTag}</span>
                                )) : <span>No tags</span>}
                            </div>
                        </article>
                    ))
                )}
            </main>
        </div>
    )
}

export default Library