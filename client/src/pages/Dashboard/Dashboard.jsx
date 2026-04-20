import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CoursesCard from '../../components/CourseCards/CourseCard'
import { coursesApi } from '../../api/coursesApi'
import './Dashboard.css'

const Dashboard = () => {
    const navigate = useNavigate()
    const [courses, setCourses] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('newest')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCourseId, setEditingCourseId] = useState(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')

    const loadCourses = async () => {
        try {
            setError('')
            const data = await coursesApi.getAll()
            setCourses(data)
        } catch (err) {
            setError(err.message)
        }
    }

    useEffect(() => {
        loadCourses()
    }, [])

    const filteredCourses = useMemo(() => {
        const normalizedSearch = searchTerm.toLowerCase().trim()

        const filtered = courses.filter((course) =>
            course.title.toLowerCase().includes(normalizedSearch)
        )

        if (sortBy === 'alphabetical') {
            return [...filtered].sort((a, b) => a.title.localeCompare(b.title))
        }

        return [...filtered].sort((a, b) => b.course_id - a.course_id)
    }, [courses, searchTerm, sortBy])

    const openCreateModal = () => {
        setEditingCourseId(null)
        setTitle('')
        setDescription('')
        setIsModalOpen(true)
    }

    const openEditModal = (course) => {
        setEditingCourseId(course.course_id)
        setTitle(course.title)
        setDescription(course.description || '')
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
    }

    const handleSaveCourse = async (event) => {
        event.preventDefault()

        const normalizedTitle = title.trim()
        const normalizedDescription = description.trim()

        if (!normalizedTitle) {
            return
        }

        try {
            setError('')

            if (editingCourseId) {
                await coursesApi.update(editingCourseId, {
                    title: normalizedTitle,
                    description: normalizedDescription
                })
            } else {
                await coursesApi.create({
                    title: normalizedTitle,
                    description: normalizedDescription,
                    user_id: 1
                })
            }

            closeModal()
            await loadCourses()
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteCourse = async (id) => {
        const shouldDelete = window.confirm('Are you sure you want to delete this course?')

        if (!shouldDelete) {
            return
        }

        try {
            setError('')
            await coursesApi.remove(id)
            await loadCourses()
        } catch (err) {
            setError(err.message)
        }
    }

    const handleCardClick = (courseId) => {
        const selectedCourse = courses.find((course) => course.course_id === courseId)

        navigate(`/courses/${courseId}`, {
            state: {
                course: selectedCourse
            }
        })
    }

    return (
        <div id="app">
            <header id="center">
                <h1>Course Dashboard</h1>
                <button id="add-course-btn" className="counter" onClick={openCreateModal}>
                    + Add New Course
                </button>
            </header>

            <section className="controls">
                <input
                    type="text"
                    id="search-bar"
                    placeholder="Search courses by name..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />
                <select
                    id="sort-filter"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                >
                    <option value="newest">Newest First</option>
                    <option value="alphabetical">A-Z</option>
                </select>
            </section>

            {error ? <p style={{ padding: '0 20px', color: '#d00' }}>{error}</p> : null}

            <main id="course-grid" className="next-steps-grid">
                {filteredCourses.map((course) => (
                    <CoursesCard
                        key={course.course_id}
                        course={course}
                        onCardClick={handleCardClick}
                        onEdit={openEditModal}
                        onDelete={handleDeleteCourse}
                    />
                ))}
            </main>

            {isModalOpen && (
                <dialog id="course-modal" open>
                    <form id="course-form" method="dialog" onSubmit={handleSaveCourse}>
                        <h2 id="modal-title">{editingCourseId ? 'Edit Course' : 'Add Course'}</h2>
                        <input type="hidden" id="course-id" value={editingCourseId || ''} readOnly />
                        <input
                            type="text"
                            id="title"
                            placeholder="Course Title"
                            required
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                        />
                        <textarea
                            id="description"
                            placeholder="Course Description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                        <div className="modal-actions">
                            <button type="button" id="close-modal" onClick={closeModal}>
                                Cancel
                            </button>
                            <button type="submit" id="save-course">
                                Save Course
                            </button>
                        </div>
                    </form>
                </dialog>
            )}
        </div>
    )
}

export default Dashboard