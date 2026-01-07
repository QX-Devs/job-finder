// src/services/aiApplyService.js
import api from './api';

const aiApplyService = {
  /**
   * Start AI-powered job application
   * @param {Object} params - Application parameters
   * @param {number} params.resumeId - ID of the resume to use
   * @param {string} params.jobUrl - LinkedIn job URL
   * @param {string} params.jobTitle - Job title
   * @param {string} params.company - Company name
   * @returns {Promise} - Application job details
   */
  startApplication: async ({ resumeId, jobUrl, jobTitle, company }) => {
    try {
      const response = await api.post('/ai-apply/start', {
        resumeId,
        jobUrl,
        jobTitle,
        company
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to start AI application' };
    }
  },

  /**
   * Get status of an AI application job
   * @param {string} jobId - The application job ID
   * @returns {Promise} - Current status
   */
  getStatus: async (jobId) => {
    try {
      const response = await api.get(`/ai-apply/status/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get application status' };
    }
  },

  /**
   * Get all user's AI application jobs
   * @returns {Promise} - List of application jobs
   */
  getMyJobs: async () => {
    try {
      const response = await api.get('/ai-apply/jobs');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get application jobs' };
    }
  },

  /**
   * Poll for application status until complete
   * @param {string} jobId - The application job ID
   * @param {Function} onProgress - Callback for progress updates
   * @param {number} interval - Polling interval in ms (default: 2000)
   * @param {number} timeout - Max wait time in ms (default: 5 minutes)
   * @returns {Promise} - Final status
   */
  pollStatus: async (jobId, onProgress, interval = 2000, timeout = 300000) => {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const result = await aiApplyService.getStatus(jobId);
          
          if (onProgress) {
            onProgress(result.data);
          }

          if (result.data.status === 'completed') {
            resolve(result.data);
            return;
          }

          if (result.data.status === 'failed') {
            reject(new Error(result.data.error || 'Application failed'));
            return;
          }

          // Check timeout
          if (Date.now() - startTime > timeout) {
            reject(new Error('Application timed out'));
            return;
          }

          // Continue polling
          setTimeout(poll, interval);
          
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
};

export default aiApplyService;
