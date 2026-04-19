const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

async function loadCourseDetails() {
    const response = await fetch(`/courses/${courseId}`);
    const course = await response.json();

    document.getElementById('course-title').innerText = course.title;
    document.getElementById('course-description').innerText = course.description || '';

    // Clear lists
    const notesList = document.getElementById('notes-list');
    const materialsList = document.getElementById('materials-list');
    const assignmentsList = document.getElementById('assignments-list');
    
    [notesList, materialsList, assignmentsList].forEach(list => list.innerHTML = '');

    // Organize items by type
    course.items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'item-card';
        li.innerHTML = `
            <span>${item.content}</span>
            <button onclick="deleteItem(${item.id})" class="delete-btn">×</button>
        `;

        if (item.type === 'note') notesList.appendChild(li);
        else if (item.type === 'material') materialsList.appendChild(li);
        else if (item.type === 'assignment') assignmentsList.appendChild(li);
    });
}

// add a new note/material/assignment
window.addItem = async (type) => {
    const content = prompt(`Enter ${type} content:`);
    if (!content) return;

    await fetch(`/courses/${courseId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content })
    });
    
    loadCourseDetails();
};

// delete a specific note/material/assignment
window.deleteItem = async (itemId) => {
    if (confirm('Delete this item?')) {
        await fetch(`/courses/items/${itemId}`, {
            method: 'DELETE'
        });
        loadCourseDetails(); // Refresh the list
    }
};

loadCourseDetails();