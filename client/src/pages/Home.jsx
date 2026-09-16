import { Link } from 'react-router-dom';
import authService from '../services/authService';
import './Home.css';
import projectsImage from '../icons/icon-project.png'
import efficiencyImage from '../icons/icon-efficient.png'
import collaborationImage from '../icons/icon-collab.png'
import trackingImage from '../icons/icon-tracking.png'

const Home = () => {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <div className="home-container">
      <div className="welcome-content">
        <div className="welcome-text">
          <h1>Project and Task Management</h1>
          
          <div className="divider">
            <div className="divider-line"></div>
            <span>✦</span>
            <div className="divider-line"></div>
          </div>
          
          <p className="subtitle">
            Organize your projects, manage tasks, and collaborate with your team
            simply and effectively!
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <img src={projectsImage} alt="Projects Icon" />
              </div>
              <h3>Organized Projects</h3>
              <p>Create and manage multiple projects with ease</p>
            </div>

            <div className="feature-card">
               <div className="feature-icon">
                <img src={efficiencyImage} alt="Efficiency Icon" />
              </div>
              <h3>Efficient Tasks</h3>
              <p>Manage tasks with states and priorities</p>
            </div>

            <div className="feature-card">
               <div className="feature-icon">
                <img src={collaborationImage} alt="Collaboration Icon" />
              </div>
              <h3>Collaboration</h3>
              <p>Work in teams and assign tasks easily</p>
            </div>

            <div className="feature-card">
               <div className="feature-icon">
                <img src={trackingImage} alt="Tracking Icon" />
              </div>
              <h3>Tracking</h3>
              <p>Visualize the progress of your projects in real-time</p>
            </div>
          </div>

          <div className="cta-buttons">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  Start for Free
                </Link>
                <Link to="/login" className="btn btn-outline btn-large">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;