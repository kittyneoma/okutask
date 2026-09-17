import api from './api';

const authService = {
  // registers new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // login
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // gets current user
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // updates profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // changes password
  changePassword: async (passwords) => {
    try {
      const response = await api.put('/auth/password', passwords);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // verifies auth
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // gets user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // gets token
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default authService;