import { useState } from 'react';
import projectService from '../services/projectService';
import './ProjectModal.css';

const COLORS = [
  '#2292A4', '#D65780', '#9C27B0', '#4CAF50',
  '#FF9800', '#E91E63', '#F44336', '#2196F3',
  '#009688', '#607D8B'
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: '#42F581' },
  { value: 'medium', label: 'Medium', color: '#FFE926' },
  { value: 'high',   label: 'High',   color: '#EE8931' },
  { value: 'urgent', label: 'Urgent', color: '#EF5350' },
];

const ProjectModal = ({ onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2292A4',
    priority: 'medium',
    dueDate: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleColorSelect = (color) => {
    setFormData({ ...formData, color });
  };

  const handlePrioritySelect = (value) => {
    setFormData({ ...formData, priority: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : []
      };
      if (!payload.dueDate) delete payload.dueDate;
      const response = await projectService.createProject(payload);
      onProjectCreated(response.data.project);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">

        <div className="modal-header">
          <h2>New Project</h2>
        </div>

        {error && (
          <div className="alert alert-error modal-alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">

          {/* name */}
          <div className="form-group">
            <label htmlFor="proj-name" className="label">
              Project Name <span className="required">*</span>
            </label>
            <input
              id="proj-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="e.g. Website Redesign"
              required
              autoFocus
            />
          </div>

          {/* description */}
          <div className="form-group">
            <label htmlFor="proj-desc" className="label">Description</label>
            <textarea
              id="proj-desc"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="modal-textarea"
              placeholder="What is this project about?"
            />
          </div>

          <div className="modal-divider" />

          {/* color row + priority/date */}
          <div className="modal-row">

            {/* color */}
            <div className="form-group modal-col">
              <label className="label">Color</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <span
                    key={c}
                    className={`color-dot ${formData.color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => handleColorSelect(c)}
                    title={c}
                  />
                ))}
              </div>

              <div className="modal-divider modal-divider--sm" />

              <div className="color-preview" style={{ borderLeftColor: formData.color }}>
                <span className="color-preview-dot" style={{ backgroundColor: formData.color }} />
                <span>{formData.name || 'Project Preview'}</span>
              </div>
            </div>

            {/* priority nd date */}
            <div className="form-group modal-col">
              <label className="label">Priority</label>

              {/* priority buttons */}
              <div className="priority-buttons">
                {PRIORITIES.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    className={`priority-btn ${formData.priority === value ? 'active' : ''}`}
                    style={{
                      borderColor: formData.priority === value ? color : 'transparent',
                      backgroundColor: formData.priority === value ? color : 'transparent',
                      color: formData.priority === value ? '#fff' : 'var(--text-primary)',
                    }}
                    onClick={() => handlePrioritySelect(value)}
                  >
                    <span
                      className="priority-btn-dot"
                      style={{
                        backgroundColor: formData.priority === value
                          ? 'rgba(255,255,255,0.75)'
                          : color
                      }}
                    />
                    {label}
                  </button>
                ))}
              </div>

              <label htmlFor="proj-due" className="label" style={{ marginTop: '14px' }}>
                Due Date
              </label>
              <input
                id="proj-due"
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="modal-divider" />

          {/* tags */}
          <div className="form-group">
            <label htmlFor="proj-tags" className="label">Tags</label>
            <input
              id="proj-tags"
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="input"
              placeholder="design, frontend, urgent  (separate with commas)"
            />
          </div>

          <div className="modal-divider" />

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : '✚ Create Project'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProjectModal;