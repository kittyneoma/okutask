import api from './api';

const projectService = {
  // gets all projects
  getProjects: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/projects?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // gets project by id
  getProject: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // creates new project
  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // updates existing project
  updateProject: async (id, projectData) => {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // deletes project
  deleteProject: async (id) => {
    try {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // archives/unarchive project
  toggleArchive: async (id) => {
    try {
      const response = await api.put(`/projects/${id}/archive`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // adds collaborator
  addCollaborator: async (projectId, userId) => {
    try {
      const response = await api.post(`/projects/${projectId}/collaborators`, { userId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // gets project stats
  getProjectStats: async (id) => {
    try {
      const response = await api.get(`/projects/${id}/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default projectService;