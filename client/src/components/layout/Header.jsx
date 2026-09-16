import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import authService from '../../services/authService';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <>
      <header className="header">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="logo">
          ACCO
        </Link>

        {isAuthenticated ? (
          <div className="header-right">

            <Link to="/chat" className="header-link">
              Chat
            </Link>
            
            <div 
              className="user-menu" 
              onClick={() => setShowMenu(!showMenu)}
            >
              <div className="user-avatar">
                <img 
                  src={currentUser?.avatar || 'https://ui-avatars.com/api/?background=2292A4&color=fff'} 
                  alt={currentUser?.name} 
                />
              </div>
              <span className="user-name">{currentUser?.name}</span>
              
              {showMenu && (
                <div className="dropdown-menu">
                  <Link to="/dashboard" onClick={() => setShowMenu(false)}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout}>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="header-right">
            <Link to="/login" className="header-link">
              Login
            </Link>
            <Link to="/register" className="header-link">
              Register
            </Link>
          </div>
        )}
      </header>
      
      <div className="thin-container"></div>
    </>
  );
};

export default Header;