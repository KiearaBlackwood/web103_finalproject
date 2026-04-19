const courseGrid = document.getElementById('course-grid');
const courseModal = document.getElementById('course-modal');
const courseForm = document.getElementById('course-form');

// Fetch and display all courses
async function fetchCourses() {
    const response = await fetch('/courses');
    const courses = await response.json();
    renderCourses(courses);
}

function renderCourses(courses) {
    courseGrid.innerHTML = '';
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <h2>${course.title}</h2>
            <p>${course.description || 'No description provided.'}</p>
            <div class="card-actions">
                <button onclick="editCourse(${course.id})">Edit</button>
                <button onclick="deleteCourse(${course.id})" class="delete-btn">Delete</button>
            </div>
        `;
        // Navigate to a single course view 
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                window.location.href = `/course.html?id=${course.id}`;
            }
        });
        courseGrid.appendChild(card);
    });
}

// Create or Update Course
courseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('course-id').value;
    const data = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        user_id: 'default_user' // Placeholder 
    };

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `/courses/${id}` : '/courses';

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    courseModal.close();
    courseForm.reset();
    fetchCourses();
});

// Delete Course
window.deleteCourse = async (id) => {
    if (confirm('Are you sure you want to delete this course?')) {
        await fetch(`/courses/${id}`, { method: 'DELETE' });
        fetchCourses();
    }
};

// Open Modal for Create
document.getElementById('add-course-btn').addEventListener('click', () => {
    document.getElementById('course-id').value = '';
    document.getElementById('modal-title').innerText = 'Add Course';
    courseModal.showModal();
});

document.getElementById('close-modal').addEventListener('click', () => courseModal.close());

let allCourses = []; // Local cache of database results

async function fetchCourses2() {
    const response = await fetch('/courses');
    allCourses = await response.json();
    applyFilters(); 
}

function applyFilters() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    const sortBy = document.getElementById('sort-filter').value;

    let filtered = allCourses.filter(course => 
        course.title.toLowerCase().includes(searchTerm)
    );

    if (sortBy === 'alphabetical') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        filtered.sort((a, b) => b.id - a.id); 
    }

    renderCourses(filtered);
}


document.getElementById('search-bar').addEventListener('input', applyFilters);
document.getElementById('sort-filter').addEventListener('change', applyFilters);


fetchCourses2();