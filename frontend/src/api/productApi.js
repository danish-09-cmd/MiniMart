import axiosClient from './axiosClient.js';

const PRODUCTS_URL = '/api/products';

const productApi = {
  getProducts: (params, config = {}) => axiosClient.get(PRODUCTS_URL, { ...config, params }),
  getProduct: (id, config = {}) => axiosClient.get(`${PRODUCTS_URL}/${id}`, config),
};

export default productApi;
