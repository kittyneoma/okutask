import axios from 'axios';

// creates axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// interceptor to add the token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// interceptor to handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // the server responded with an error code
      if (error.response.status === 401) {
        // invalid/expired token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // returns the server error message
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // the request was made but there was no response.
      return Promise.reject({
        success: false,
        message: 'Could not connect to the server. Please try again.'
      });
    } else {
      return Promise.reject({
        success: false,
        message: error.message || 'Unknown error occurred'
      });
    }
  }
);

export default api;