import api from './api';

const candidateService = {
  // Get ranked candidates for a job
  getRankedCandidates: async (jobId) => {
    try {
      const response = await api.get(`/candidates/rank/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get ranked candidates' };
    }
  },

  // Calculate score for a candidate
  calculateScore: async (candidateId, jobId) => {
    try {
      const response = await api.post('/candidates/score', { candidateId, jobId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to calculate score' };
    }
  }
};

export default candidateService;

