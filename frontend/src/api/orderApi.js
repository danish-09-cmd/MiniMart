import axiosClient from './axiosClient.js';

const ORDERS_URL = '/api/orders';

const orderApi = {
  placeOrder: (addressId) => axiosClient.post(ORDERS_URL, { addressId }),
  getOrders: ({ page = 0, size = 10 } = {}) => axiosClient.get(ORDERS_URL, { params: { page, size } }),
  getOrder: (id) => axiosClient.get(`${ORDERS_URL}/${id}`),
  cancelOrder: (id) => axiosClient.put(`${ORDERS_URL}/${id}/cancel`),
};

export default orderApi;
