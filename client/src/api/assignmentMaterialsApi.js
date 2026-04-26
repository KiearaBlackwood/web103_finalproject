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

export const assignmentMaterialsApi = {
    //Get all materials for an assignment.
    getAll: (itemId, params = {}) => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value)
            }
        })
        const qs = searchParams.toString()
        return request(`/courses/items/assignments/${itemId}/materials${qs ? `?${qs}` : ''}`)
    },

    //Get a single material.
    getById: (itemId, materialId) =>
        request(`/courses/items/assignments/${itemId}/materials/${materialId}`),

    //materials
    /*create: (itemId, material) =>
        request(`/courses/items/assignments/${itemId}/materials`, {
            method: 'POST',
            body: JSON.stringify(material)
        }), */

    create: (itemId, formData) =>
    fetch(`${API_BASE_URL}/courses/items/assignments/${itemId}/materials`, {
        method: 'POST',
        body: formData 
    }).then(res => res.json()),

    //Update title / description / file_type / tags.
    update: (itemId, materialId, updates) =>
        request(`/courses/items/assignments/${itemId}/materials/${materialId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        }),

    //Delete a material.
    remove: (itemId, materialId) =>
        request(`/courses/items/assignments/${itemId}/materials/${materialId}`, {
            method: 'DELETE'
        })
}