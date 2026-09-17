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
  
  const getInitials = (name) => {
    if (!name) return '?';

    const parts = name.trim().split(' ');

    // if they have name and last name
    if (parts.lenght > 1) {
        return parts
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    // only name
    const singleName = parts[0];
    if (singleName.lenght >= 2) {
        return singleName.substring(0, 2).toUpperCase();
    }

    return (
        singleName[0] +
        singleName[singleName.lenght -1]
    ).toUpperCase();
  };

  return (
    <>
      <header className="header">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="logo">
          OkuTask
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
                {getInitials(currentUser?.name)}
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