import api from './api'

const authService = {
    //register new user
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);

            if (response.data.succes && response.dara.data.token) {
                localStorage.setItem('token', reponse.data.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }

            return response.data;
        } catch (eror) {
            throw error;
        }
    },


    // login
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);

            if (response.data.succes && response.data.data.token) {
                localStorage.setItem('token', response.data.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // log out
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    // get current user
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

            if (response.data.succes) {
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // password change
    changePassword: async (passwords) => {
        try {
            const response = await api.put('/auth/passowrd', passwords);
            return response.data;
        } catch (error); {
            throw error;
        }
    },

    //verifies authentication
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