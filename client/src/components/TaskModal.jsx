import { useState } from 'react';
import taskService from '../services/taskService';
import './TaskModal.css';

const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: '#42f581' },
  { value: 'medium', label: 'Medium', color: '#FFD600' },
  { value: 'high',   label: 'High',   color: '#FF6D00' },
  { value: 'urgent', label: 'Urgent', color: '#EF5350' },
];

const TaskModal = ({ projectId, onClose, onTaskCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handlePrioritySelect = (value) => {
    setFormData({ ...formData, priority: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.dueDate) delete payload.dueDate;
      const response = await taskService.createTask(projectId, payload);
      onTaskCreated(response.data.task);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
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

        {/* header sin boton X */}
        <div className="modal-header">
          <h2>New Task</h2>
        </div>

        {error && (
          <div className="alert alert-error modal-alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">

          {/* title */}
          <div className="form-group">
            <label htmlFor="task-title" className="label">
              Title <span className="required">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="e.g. Design the login screen"
              required
              autoFocus
            />
          </div>

          {/* description */}
          <div className="form-group">
            <label htmlFor="task-desc" className="label">Description</label>
            <textarea
              id="task-desc"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="modal-textarea"
              placeholder="What needs to be done?"
            />
          </div>

          <div className="modal-divider" />

          {/* priority + date row */}
          <div className="task-modal-row">

            {/* priority buttons */}
            <div className="form-group">
              <label className="label">Priority</label>
              <div className="priority-buttons">
                {PRIORITIES.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    className={`priority-btn ${formData.priority === value ? 'active' : ''}`}
                    style={{
                      borderColor:     formData.priority === value ? color : 'transparent',
                      backgroundColor: formData.priority === value ? color : 'transparent',
                      color:           formData.priority === value ? '#fff' : 'var(--text-primary)',
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
            </div>

            {/* date */}
            <div className="form-group">
              <label htmlFor="task-due" className="label">Due Date</label>
              <input
                id="task-due"
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

          {/* buttons */}
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
              {loading ? 'Creating...' : '✚ Create Task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TaskModal;