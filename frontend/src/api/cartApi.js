import axiosClient from './axiosClient.js';

const CART_URL = '/api/cart';

const cartApi = {
  getCart: () => axiosClient.get(CART_URL),
  addItem: (productId, quantity) => axiosClient.post(`${CART_URL}/items`, { productId, quantity }),
  updateItem: (productId, quantity) => axiosClient.put(`${CART_URL}/items/${productId}`, { quantity }),
  removeItem: (productId) => axiosClient.delete(`${CART_URL}/items/${productId}`),
  clearCart: () => axiosClient.delete(CART_URL),
};

export default cartApi;
