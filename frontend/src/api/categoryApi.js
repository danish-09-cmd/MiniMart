import axiosClient from './axiosClient.js';

const categoryApi = {
  getCategories: (config = {}) => axiosClient.get('/api/categories', config),
};

export default categoryApi;
