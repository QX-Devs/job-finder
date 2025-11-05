// src/services/applicationService.js
import api from './api';
import { API_ENDPOINTS } from './apiConstants';

const applicationService = {
  list: async () => {
    const res = await api.get(API_ENDPOINTS.APPLICATIONS.BASE);
    return res.data;
  },
  create: async (payload) => {
    const res = await api.post(API_ENDPOINTS.APPLICATIONS.BASE, payload);
    return res.data;
  },
  update: async (id, payload) => {
    const res = await api.put(API_ENDPOINTS.APPLICATIONS.BY_ID(id), payload);
    return res.data;
  },
  remove: async (id) => {
    const res = await api.delete(API_ENDPOINTS.APPLICATIONS.BY_ID(id));
    return res.data;
  },
};

export default applicationService;




