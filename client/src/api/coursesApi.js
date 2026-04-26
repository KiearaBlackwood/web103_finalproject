const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Request failed with status ${response.status}`)
    }

    if (response.status === 204) {
        return null
    }

    return response.json()
}

export const coursesApi = {
    getAll: () => request('/courses'),
    getItems: (params = {}) => {
        const searchParams = new URLSearchParams()

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value)
            }
        })

        const queryString = searchParams.toString()
        return request(`/courses/items${queryString ? `?${queryString}` : ''}`)
    },
    getById: (id) => request(`/courses/${id}`),
    create: (course) => request('/courses', {
        method: 'POST',
        body: JSON.stringify(course)
    }),
    update: (id, course) => request(`/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(course)
    }),
    remove: (id) => request(`/courses/${id}`, {
        method: 'DELETE'
    }),
    addItem: (courseId, item) => request(`/courses/${courseId}/items`, {
        method: 'POST',
        body: JSON.stringify(item)
    }),
    removeItem: (itemId) => request(`/courses/items/${itemId}`, {
        method: 'DELETE'
    })
}