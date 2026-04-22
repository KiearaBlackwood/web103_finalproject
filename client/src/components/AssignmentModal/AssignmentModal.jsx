import { useEffect, useRef, useState } from 'react'
import './AssignmentModal.css'

const EMPTY_FORM = { content: '', due_date: '', tags: '', status: 'incomplete' }

const toInputDate = (isoString) => {
    if (!isoString) return ''
    return isoString.slice(0, 10)
}

const AssignmentModal = ({ isOpen, onClose, onSubmit, initial = null }) => {
    const [form, setForm] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState({})
    const firstInputRef = useRef(null)
    const isEdit = Boolean(initial)

    useEffect(() => {
        if (isOpen) {
            setForm(
                initial
                    ? {
                          content: initial.content ?? '',
                          due_date: toInputDate(initial.due_date),
                          tags: (initial.tags ?? []).join(', '),
                          status: initial.status ?? 'incomplete'
                      }
                    : EMPTY_FORM
            )
            setErrors({})
            // Defer focus until the modal is painted
            setTimeout(() => firstInputRef.current?.focus(), 0)
        }
    }, [isOpen, initial])

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return
        const handleKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const validate = () => {
        const next = {}
        if (!form.content.trim()) next.content = 'Description is required.'
        if (form.due_date && Number.isNaN(Date.parse(form.due_date))) {
            next.due_date = 'Enter a valid date.'
        }
        return next
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const validation = validate()
        if (Object.keys(validation).length > 0) {
            setErrors(validation)
            return
        }
        onSubmit({
            content: form.content.trim(),
            due_date: form.due_date || null,
            tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
            status: form.status
        })
    }

    return (
        <div
            className="modal-backdrop"
            role="presentation"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="modal-header">
                    <h2 id="modal-title">{isEdit ? 'Edit Assignment' : 'New Assignment'}</h2>
                    <button
                        type="button"
                        className="modal-close"
                        aria-label="Close dialog"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="assignment-content">
                            Description <span aria-hidden="true" className="required">*</span>
                        </label>
                        <textarea
                            id="assignment-content"
                            ref={firstInputRef}
                            name="content"
                            value={form.content}
                            onChange={handleChange}
                            rows={3}
                            aria-required="true"
                            aria-describedby={errors.content ? 'content-error' : undefined}
                            className={errors.content ? 'input-error' : ''}
                            placeholder="Describe the assignment…"
                        />
                        {errors.content && (
                            <span id="content-error" className="field-error" role="alert">
                                {errors.content}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="assignment-due-date">Due Date</label>
                        <input
                            type="date"
                            id="assignment-due-date"
                            name="due_date"
                            value={form.due_date}
                            onChange={handleChange}
                            aria-describedby={errors.due_date ? 'due-date-error' : undefined}
                            className={errors.due_date ? 'input-error' : ''}
                        />
                        {errors.due_date && (
                            <span id="due-date-error" className="field-error" role="alert">
                                {errors.due_date}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="assignment-tags">Tags</label>
                        <input
                            type="text"
                            id="assignment-tags"
                            name="tags"
                            value={form.tags}
                            onChange={handleChange}
                            placeholder="e.g. exam, chapter-3, priority"
                        />
                        <span className="form-hint">Comma-separated</span>
                    </div>

                    <div className="form-group form-group--inline">
                        <input
                            type="checkbox"
                            id="assignment-status"
                            name="status"
                            checked={form.status === 'complete'}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    status: e.target.checked ? 'complete' : 'incomplete'
                                }))
                            }
                        />
                        <label htmlFor="assignment-status">Mark as complete</label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {isEdit ? 'Save Changes' : 'Add Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AssignmentModal
