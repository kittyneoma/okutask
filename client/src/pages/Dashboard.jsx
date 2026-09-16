import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import projectService from '../services/projectService';
import ProjectModal from '../components/ProjectModal';
import './Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

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

  // adds new project to list without refresh
  const handleProjectCreated = (newProject) => {
    setProjects(prev => [{ ...newProject, progress: 0 }, ...prev]);
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
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="project-card card"
              style={{ borderLeftColor: project.color }}
            >
              <div className="project-header">
                <h3>{project.name}</h3>
                <span className={`status-badge status-${project.status}`}>
                  {project.status}
                </span>
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
            </Link>
          ))}
        </div>
      )}

      {/* new project modal */}
      {showModal && (
        <ProjectModal
          onClose={() => setShowModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

    </div>
  );
};

export default Dashboard;