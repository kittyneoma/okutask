import { useState, useEffect } from 'react';
import projectService from '../services/projectService';
import ProjectModal from '../components/ProjectModal';
import ConfirmModal from '../components/ConfirmModal';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const PROJECT_STATUSES = ['active', 'on-hold', 'completed', 'archived'];

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getProjects();
      setProjects(response.data.projects);
    } catch (err) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // adds new project to list 
  const handleProjectCreated = (newProject) => {
    setProjects(prev => [{ ...newProject, progress: 0 }, ...prev]);
  };

  // updates status project
  const handleStatusChange = async (e, projectId) => {
    const newStatus = e.target.value;
    try {
      await projectService.updateProject(projectId, { status: newStatus });
      setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: newStatus } : p));
    } catch (err) {
      console.error('Failed to update project status', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await projectService.deleteProject(confirmDelete.id);
      setProjects(prev => prev.filter(p => p._id !== confirmDelete.id));
    } catch (err) {
      console.error('Delete failed', err);
  } finally {
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <h1>My Projects</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          ✚ New Project
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state card">
          <h2>You don't have any projects yet</h2>
          <p>Create your first project to start organizing your tasks</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div
                key={project._id}
              className="project-card card"
              style={{ borderLeftColor: project.color }}
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              <div className="project-header">
                <h3>{project.name}</h3>
                {/* editable status */}
                <div onClick={e => e.stopPropagation()}>
                  <select
                    className={`status-select status-${project.status}`}
                    value={project.status}
                    onChange={(e) => handleStatusChange(e, project._id)}
                    onClick={e => e.preventDefault()}
                  >
                    {PROJECT_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="action-btn delete-btn card-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    
                      setConfirmDelete({
                          id: project._id,
                          name: project.name
                      });
                    }}
                  title="Delete Project"
                >
                  Delete
                </button>
              </div>

              <p className="project-description">{project.description}</p>

              <div className="project-stats">
                <div className="stat">
                  <span className="stat-label">Progress</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                  <span className="stat-value">{project.progress || 0}%</span>
                </div>
              </div>

              <div className="project-footer">
                <span className={`priority-badge priority-${project.priority}`}>
                  {project.priority}
                </span>
                <span className="task-count">
                  {project.taskCount || 0} Tasks
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* modals */}
      {showModal && (
        <ProjectModal
          onClose={() => setShowModal(false)}
          onProjectCreated={handleProjectCreated}
          onProjectUpdated={() => {}}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Delete Project"
          detail={`"${confirmDelete.name}" and all its tasks will be permanently deleted.`}
          confirmText="Yes, Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

    </div>
  );
};

export default Dashboard;