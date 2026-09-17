import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import authService from './services/authService';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import Chat from './pages/Chat';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

import './styles/global.css';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

const AppLayout = () => {
  const location = useLocation();

  const hideFooter = location.pathname === '/chat';

  return (
    <div className='app'>
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/projects/new" element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;