import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import TaskModal from '../components/TaskModal';
import ProjectModal from '../components/ProjectModal';
import calendarIcon from '../icons/icon-calendar.png';
import ConfirmModal from '../components/ConfirmModal';
import './ProjectDetail.css';

const STATUS_LABELS = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'review': 'Review',
  'completed': 'Completed',
  'blocked': 'Blocked'
};

const PROJECT_STATUSES = ['active', 'on-hold', 'completed', 'archived'];
const TASK_STATUSES = ['todo', 'in-progress', 'review', 'completed', 'blocked'];

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        projectService.getProject(id),
        taskService.getTasks(id)
      ]);
      setProject(projectRes.data.project);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      setError(err.message || 'Error loading project data');
    } finally {
      setLoading(false);
    }
  };

  // refresh page
  const refreshProjectData = async () => {
    try {
      const projectRes = await projectService.getProject(id);

      setProject(projectRes.data.project);
    } catch (err) {
      console.error('Failed to refresh project data', err);
    }
  };

  // updates status project
  const handleProjectStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await projectService.updateProject(id, { status: newStatus });
      setProject(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Failed to update project status', err);
    }
  };

  // updates status task
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

      await refreshProjectData();
    } catch (err) {
      console.error('Failed to update task status', err);
    }
  };

  // adds new task
  const handleTaskCreated = (newTask) => {
    setTasks(prev => [newTask, ...prev]);

    refreshProjectData();
  };

  const handleProjectUpdated = (updatedProject) => {
    setProject(prev => ({ ...prev, ...updatedProject }));
  }

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));

    refreshProjectData();
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  // deletes task
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'project') {
        await projectService.deleteProject(confirmDelete.id);
        navigate('/dashboard');
      } else {
        await taskService.deleteTask(confirmDelete.id);
        setTasks(prev => prev.filter(t => t._id !== confirmDelete.id));

        await refreshProjectData();
      }
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setConfirmDelete(null);
    }
  };

  // load/error states
  if (loading) {
    return (
      <div className="project-detail-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-detail-container">
        <div className="alert alert-error">{error || 'Project not found'}</div>
        <Link to="/dashboard" className="btn btn-outline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="project-detail-container">

      {/* project header */}
      <div className="project-detail-header">
        <Link to="/dashboard" className="back-button">↩ Go Back</Link>
        <div className="project-title-row">
          <div
            className="project-color-dot"
            style={{ background: project.color }}
          />
          <h1>{project.name}</h1>

          {/* editable status project */}
          <select
            className={`status-select status-${project.status}`}
            value={project.status}
            onChange={handleProjectStatusChange}
          >
            {PROJECT_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}

          </select>

          {/* edit/delete project actions */}
          <div className="project-actions">
            <button
              className="btn btn-action edit-btn"
              onClick={() => setShowProjectModal(true)}
              title="Edit Project"
            >
              Edit
            </button>
            <button
              className="btn btn-action delete-btn"
              onClick={() => setConfirmDelete({
                type: 'project', id: project._id, name: project.name
              })}
              title="Delete Project"
            >
              Delete
            </button>
          </div>
        </div>

        {project.description && (
          <p className="project-detail-desc">{project.description}</p>
        )}
      </div>

      {/* stats */}
      <div className="project-stats-grid">
        <div className="stat-card card">
          <span className="stat-label">Total Tasks</span>
          <p className="stat-number">{project.stats?.total || 0}</p>
        </div>
        <div className="stat-card card">
          <span className="stat-label">Completed</span>
          <p className="stat-number">{project.stats?.completed || 0}</p>
        </div>
        <div className="stat-card card">
          <span className="stat-label">In Progress</span>
          <p className="stat-number">{project.stats?.['in-progress'] || 0}</p>
        </div>
        <div className="stat-card card">
          <span className="stat-label">Progress</span>
          <p className="stat-number">{project.progress || 0}%</p>
        </div>
      </div>

      {/* progress bar */}
      <div className="detail-progress-bar">
        <div
          className="detail-progress-fill"
          style={{
            width: `${project.progress || 0}%`,
            background: project.color
          }}
        />
      </div>

      {/* tasks section */}
      <div className="tasks-section">
        <div className="tasks-header">
          <h2>Tasks</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowTaskModal(true)}
          >
            + New Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state card">
            <p>No tasks in this project yet</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowTaskModal(true)}
            >
              Create First Task
            </button>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map(task => (
              <div key={task._id} className="task-item card">
                <div className="task-item-header">
                  {/* ttile, status, priority row */}
                  <div className="task-title-group">
                    <h4 className="task-title">{task.title}</h4>
                  </div>
                  <select 
                    className={`status-select status-${task.status}`}
                    value={task.status}
                    onChange={(e) => handleTaskStatusChange(task._id, e.target.value)}
                  >
                    {TASK_STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                    ))}
                  </select>
                  <span className={`priority-badge priority-${task.priority}`}>
                    {task.priority}
                  </span>
                <div>
                {/* edit/delete task actions */}
                <div className="task-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEditTask(task)}
                    title="Edit Task"
                  >
                    Edit
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => setConfirmDelete({
                      type: 'task', id: task._id, name: task.title
                    })}
                    title="Delete Task"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                {task.dueDate && (
                  <p className={`task-due ${task.isOverdue ? 'overdue' : ''}`}>
                    <span className="task-due-content">
                      <img src={calendarIcon} alt="Calendar" className="task-due-icon" />
                      {new Date(task.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                      {task.isOverdue && ' — Overdue'}
                    </span>
                  </p>
                )}
              </div>
            ))} 
          </div>
        )}
      </div>

      {/* moodals */}
      {showTaskModal && (
        <TaskModal
          projectId={id}
          task={editingTask}
          onClose={closeTaskModal}
          onTaskCreated={handleTaskCreated}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {showProjectModal && (
        <ProjectModal
          project={project}
          onClose={() => setShowProjectModal(false)}
          onProjectCreated={() => {}}
          onProjectUpdated={handleProjectUpdated}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Delete ${confirmDelete.type === 'project' ? 'project' : 'task'}?`}
          detail={
            confirmDelete.type === 'project' ? `"${confirmDelete.name}" and all its tasks will be permanently deleted.`
            : `"${confirmDelete.name}" will be permanently deleted.`
          }
          confirmText="Yes, Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default ProjectDetail;