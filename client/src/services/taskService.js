import api from './api';

const taskService = {
  // gets project tasks
  getTasks: async (projectId, filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/projects/${projectId}/tasks?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // gets current user tasks
  getMyTasks: async () => {
    try {
      const response = await api.get('/tasks/my-tasks');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // gets task by id
  getTask: async (id) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // creates new task
  createTask: async (projectId, taskData) => {
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, taskData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // updates existing task
  updateTask: async (id, taskData) => {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // deletes task
  deleteTask: async (id) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // adds comment
  addComment: async (taskId, text) => {
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, { text });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // updates task position
  updatePosition: async (id, positionData) => {
    try {
      const response = await api.put(`/tasks/${id}/position`, positionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default taskService;