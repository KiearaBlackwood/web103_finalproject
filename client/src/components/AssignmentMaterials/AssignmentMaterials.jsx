import { useEffect, useState } from 'react'
import { assignmentMaterialsApi } from '../../api/assignmentMaterialsApi'
import './AssignmentMaterials.css'

const FILE_TYPE_OPTIONS = [
    { value: 'syllabus', label: 'Syllabus' },
    { value: 'reading', label: 'Reading'  },
    { value: 'slides', label: 'Slides'   },
    { value: 'other', label: 'Other'    },
]

const FILE_TYPE_EMOJI = {
    syllabus: '📋',
    reading:  '📖',
    slides:   '📊',
    other:    '📎',
}

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : ''

// Material Form 
const MaterialForm = ({ itemId, existing, onSaved, onCancel }) => {
    const [title, setTitle] = useState(existing?.title ?? '')
    const [description, setDescription] = useState(existing?.description ?? '')
    const [fileType, setFileType] = useState(existing?.file_type ?? 'other')
    const [file, setFile] = useState(null) 
    const [fileUrl, setFileUrl] = useState(existing?.file_url ?? '')
    const [tagInput, setTagInput] = useState((existing?.tags ?? []).join(', '))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const isEdit = !!existing

    const handleSubmit = async (e) => {
        e.preventDefault()
        const normalizedTitle = title.trim()

        // Validation: Must have a title and EITHER a file or a URL (if new)
        if (!normalizedTitle || (!isEdit && !file && !fileUrl.trim())) {
            setError('Please provide a title and either upload a file or enter a URL.')
            return
        }

        
        const formData = new FormData()
        formData.append('title', normalizedTitle)
        formData.append('description', description.trim())
        formData.append('file_type', fileType)
        formData.append('tags', tagInput) 

        if (file) {
            formData.append('file', file)
        } else if (!isEdit) {
            formData.append('file_url', fileUrl.trim())
            formData.append('file_name', normalizedTitle) 
        }

        setSaving(true)
        setError('')
        try {
            if (isEdit) {
                await assignmentMaterialsApi.update(itemId, existing.material_id, {
                    title: normalizedTitle,
                    description: description.trim() || null,
                    file_type: fileType,
                    tags: tagInput.split(',').map(t => t.trim()).filter(Boolean),
                })
            } else {
                await assignmentMaterialsApi.create(itemId, formData)
            }
            onSaved()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <form className="am-form" onSubmit={handleSubmit}>
            <h4 className="am-form-title">{isEdit ? 'Edit Material' : 'Add Material'}</h4>

            <label className="am-label">
                Title *
                <input
                    className="am-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Week 3 Lecture Slides"
                />
            </label>

            <label className="am-label">
                Description
                <textarea
                    className="am-input am-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional notes about this material…"
                    rows={2}
                />
            </label>

            {!isEdit && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px' }}>
                    <label className="am-label">
                        Upload File from Computer
                        <input
                            className="am-input"
                            type="file"
                            onChange={(e) => {
                                setFile(e.target.files[0])
                                if (e.target.files[0]) setFileUrl('') // Clear URL if file is picked
                            }}
                        />
                    </label>

                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text)' }}>— OR —</div>

                    <label className="am-label">
                        Link to external URL
                        <input
                            className="am-input"
                            type="url"
                            value={fileUrl}
                            onChange={(e) => {
                                setFileUrl(e.target.value)
                                if (e.target.value) setFile(null) // Clear file if URL is typed
                            }}
                            placeholder="https://…"
                        />
                    </label>
                </div>
            )}

            <label className="am-label">
                Type
                <div className="am-type-group">
                    {FILE_TYPE_OPTIONS.map((ft) => (
                        <button
                            key={ft.value}
                            type="button"
                            className={`am-type-btn${fileType === ft.value ? ' am-type-btn--active' : ''}`}
                            onClick={() => setFileType(ft.value)}
                        >
                            {FILE_TYPE_EMOJI[ft.value]} {ft.label}
                        </button>
                    ))}
                </div>
            </label>

            <label className="am-label">
                Tags <span className="am-label-hint">(comma-separated)</span>
                <input
                    className="am-input"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="css, lecture, week-3"
                />
            </label>

            {error && <p className="am-error">{error}</p>}

            <div className="am-form-actions">
                <button type="button" className="am-btn" onClick={onCancel} disabled={saving}>
                    Cancel
                </button>
                <button type="submit" className="am-btn am-btn--primary" disabled={saving}>
                    {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Material'}
                </button>
            </div>
        </form>
    )
}

// Single Material Card 
const MaterialCard = ({ itemId, material, onRefresh }) => {
    const [editing, setEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState('')

    const handleDelete = async () => {
        setDeleting(true)
        setError('')
        try {
            await assignmentMaterialsApi.remove(itemId, material.material_id)
            onRefresh()
        } catch (err) {
            setError(err.message)
            setDeleting(false)
        }
    }

    if (editing) {
        return (
            <MaterialForm
                itemId={itemId}
                existing={material}
                onSaved={() => { setEditing(false); onRefresh() }}
                onCancel={() => setEditing(false)}
            />
        )
    }

    return (
        <div className="am-card">
            <div className="am-card-top">
                <span className="am-card-type">
                    {FILE_TYPE_EMOJI[material.file_type]} {material.file_type}
                </span>
                <div className="am-card-actions">
                    <button
                        type="button"
                        className="am-icon-btn"
                        title="Edit"
                        onClick={() => setEditing(true)}
                    >
                        ✏
                    </button>
                    {!confirmDelete ? (
                        <button
                            type="button"
                            className="am-icon-btn am-icon-btn--danger"
                            title="Delete"
                            onClick={() => setConfirmDelete(true)}
                        >
                            ×
                        </button>
                    ) : (
                        <span className="am-confirm">
                            Delete?{' '}
                            <button
                                type="button"
                                className="am-icon-btn am-icon-btn--danger"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                Yes
                            </button>{' '}
                            <button
                                type="button"
                                className="am-icon-btn"
                                onClick={() => setConfirmDelete(false)}
                            >
                                No
                            </button>
                        </span>
                    )}
                </div>
            </div>

            <p className="am-card-title">
                <a href={material.file_url} target="_blank" rel="noreferrer" className="am-link">
                    {material.title}
                </a>
            </p>

            {material.description && (
                <p className="am-card-desc">{material.description}</p>
            )}

            <div className="am-card-meta">
                <span>{material.file_name}</span>
                <span>{formatDate(material.created_at)}</span>
            </div>

            {material.tags && material.tags.length > 0 && (
                <div className="am-tags">
                    {material.tags.map((tag) => (
                        <span key={tag} className="am-tag">{tag}</span>
                    ))}
                </div>
            )}

            {error && <p className="am-error">{error}</p>}
        </div>
    )
}

// Assignment Component
const AssignmentMaterials = ({ itemId }) => {
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError]  = useState('')
    const [open, setOpen] = useState(false)    
    const [showForm, setShowForm]  = useState(false)

    // Filter state 
    const [search, setSearch] = useState('')
    const [tag, setTag] = useState('')
    const [fileType, setFileType] = useState('')

    const loadMaterials = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await assignmentMaterialsApi.getAll(itemId, { search, tag, fileType })
            setMaterials(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) loadMaterials()
    }, [open, search, tag, fileType])

    const handleMaterialSaved = () => {
        setShowForm(false)
        loadMaterials()
    }

    const resetFilters = () => {
        setSearch('')
        setTag('')
        setFileType('')
    }

    return (
        <div className="am-root">
            <button
                type="button"
                className="am-toggle"
                onClick={() => setOpen((v) => !v)}
            >
                <span>📚 Course Materials</span>
                <span className="am-toggle-count">
                    {materials.length > 0 ? `${materials.length}` : ''}
                    {open ? ' ▲' : ' ▼'}
                </span>
            </button>

            {open && (
                <div className="am-panel">
                    <div className="am-controls">
                        <input
                            className="am-search"
                            type="text"
                            placeholder="Search materials…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <input
                            className="am-search"
                            type="text"
                            placeholder="Filter by tag…"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                        />
                        <select
                            className="am-select"
                            value={fileType}
                            onChange={(e) => setFileType(e.target.value)}
                        >
                            <option value="">All types</option>
                            {FILE_TYPE_OPTIONS.map((ft) => (
                                <option key={ft.value} value={ft.value}>{ft.label}</option>
                            ))}
                        </select>
                        {(search || tag || fileType) && (
                            <button type="button" className="am-btn" onClick={resetFilters}>
                                Reset
                            </button>
                        )}
                        <button
                            type="button"
                            className="am-btn am-btn--primary am-btn--add"
                            onClick={() => setShowForm((v) => !v)}
                        >
                            {showForm ? 'Cancel' : '+ Add'}
                        </button>
                    </div>

                    {showForm && (
                        <MaterialForm
                            itemId={itemId}
                            existing={null}
                            onSaved={handleMaterialSaved}
                            onCancel={() => setShowForm(false)}
                        />
                    )}

                    {error && <p className="am-error">{error}</p>}

                    {loading ? (
                        <p className="am-empty">Loading…</p>
                    ) : materials.length === 0 ? (
                        <p className="am-empty">
                            No materials yet.{' '}
                            <button
                                type="button"
                                className="am-inline-add"
                                onClick={() => setShowForm(true)}
                            >
                                Add the first one.
                            </button>
                        </p>
                    ) : (
                        <div className="am-list">
                            {materials.map((m) => (
                                <MaterialCard
                                    key={m.material_id}
                                    itemId={itemId}
                                    material={m}
                                    onRefresh={loadMaterials}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AssignmentMaterials