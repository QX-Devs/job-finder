// src/services/resumeService.js
import api from './api';
import { API_ENDPOINTS } from './apiConstants';

const resumeService = {
  // Get all resumes for current user
  getResumes: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.RESUMES.BASE);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch resumes' };
    }
  },

  // Get single resume by ID
  getResume: async (id) => {
    try {
      const response = await api.get(API_ENDPOINTS.RESUMES.BY_ID(id));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch resume' };
    }
  },

  // Create new resume
  createResume: async (resumeData) => {
    try {
      const response = await api.post(API_ENDPOINTS.RESUMES.BASE, resumeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create resume' };
    }
  },

  // Update resume
  updateResume: async (id, resumeData) => {
    try {
      const response = await api.put(API_ENDPOINTS.RESUMES.BY_ID(id), resumeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update resume' };
    }
  },

  // Delete resume
  deleteResume: async (id) => {
    try {
      const response = await api.delete(API_ENDPOINTS.RESUMES.BY_ID(id));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete resume' };
    }
  },

  // Duplicate resume
  duplicateResume: async (id) => {
    try {
      const response = await api.post(API_ENDPOINTS.RESUMES.DUPLICATE(id));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to duplicate resume' };
    }
  },

  // Get resume templates
  getTemplates: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.RESUMES.TEMPLATES);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch templates' };
    }
  },

  // Export resume (PDF/DOCX)
  exportResume: async (id, format = 'pdf') => {
    try {
      const response = await api.get(API_ENDPOINTS.RESUMES.EXPORT(id), {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to export resume' };
    }
  },

  // Preview resume
  previewResume: async (id) => {
    try {
      const response = await api.get(API_ENDPOINTS.RESUMES.PREVIEW(id));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to preview resume' };
    }
  },

  // Set resume visibility
  setVisibility: async (id, isPublic) => {
    try {
      const response = await api.patch(API_ENDPOINTS.RESUMES.BY_ID(id), {
        isPublic
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update visibility' };
    }
  }
};

export default resumeService;