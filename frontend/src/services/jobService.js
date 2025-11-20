import api from './api';

const jobService = {
  /**
   * Get all jobs from the API
   * @returns {Promise<Object>} Response with jobs array
   */
  getAll: async () => {
    try {
      const response = await api.get('/jobs');
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

