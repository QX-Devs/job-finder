import api from './api';

const jobService = {
  /**
   * Get all jobs from the API
   * @param {Object} options - Optional parameters
   * @param {string} options.careerObjective - User's career objective for job prioritization
   * @returns {Promise<Object>} Response with jobs array
   */
  getAll: async (options = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add career objective if provided for server-side prioritization
      if (options.careerObjective && options.careerObjective.trim()) {
        params.append('careerObjective', options.careerObjective.trim());
      }
      
      const queryString = params.toString();
      const url = queryString ? `/jobs?${queryString}` : '/jobs';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  /**
   * Import jobs from JSearch API
   * @param {string} query - Job search query
   * @param {string} location - Location for job search
   * @returns {Promise<Object>} Response with import results
   */
  import: async (query, location) => {
    try {
      const response = await api.post('/jobs/import', { query, location });
      return response.data;
    } catch (error) {
      console.error('Error importing jobs:', error);
      throw error;
    }
  }
};

export default jobService;

