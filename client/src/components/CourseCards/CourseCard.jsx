import './CourseCards.css'

const CoursesCard = ({ course, onCardClick, onEdit, onDelete }) => {
    return (
        <div className="course-card" onClick={() => onCardClick(course.course_id)}>
            <h2>{course.title}</h2>
            <p>{course.description || 'No description provided.'}</p>
            <div className="card-actions">
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation()
                        onEdit(course)
                    }}
                >
                    Edit
                </button>
                <button
                    type="button"
                    className="delete-btn"
                    onClick={(event) => {
                        event.stopPropagation()
                        onDelete(course.course_id)
                    }}
                >
                    Delete
                </button>
            </div>
        </div>
    )
}

export default CoursesCard