// src/services/resumeService.js
import api, { apiHelpers } from './api';
import { API_ENDPOINTS } from './apiConstants';

const resumeService = {
  // Upload existing resume file
  uploadResumeFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiHelpers.upload(API_ENDPOINTS.RESUMES.UPLOAD, formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload resume' };
    }
  },

  // Download uploaded resume file (authorized)
  downloadUploadedFile: async (storedFilename) => {
    try {
      const safeName = encodeURIComponent(storedFilename);
      const response = await api.get(
        API_ENDPOINTS.RESUMES.DOWNLOAD_FILE(safeName),
        { responseType: 'blob' } // ✅ critical
      );
      return response.data; // now it's a proper Blob
    } catch (error) {
      throw error.response?.data || { message: 'Failed to download file' };
    }
  },

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

  // Generate DOCX directly from resume payload (no existing ID)
  generateDocx: async (resumeData) => {
    try {
      const response = await api.post(API_ENDPOINTS.RESUMES.GENERATE, resumeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate document' };
    }
  },

  // Save resume progress (auto-save during CV generation)
  saveProgress: async ({ resumeId, currentStep, content, title }) => {
    try {
      const response = await api.post('/me/resumes/save-progress', {
        resumeId,
        currentStep,
        content,
        title
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to save progress' };
    }
  },

  // Get all in-progress/draft resumes
  getInProgressResumes: async () => {
    try {
      const response = await api.get('/me/resumes/in-progress');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch in-progress resumes' };
    }
  },

  // Get the most recent draft resume (for auto-continue feature)
  getLatestDraft: async () => {
    try {
      const response = await api.get('/me/resumes/latest-draft');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch latest draft' };
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