import axiosClient from './axiosClient.js';

const adminApi = {
  getDashboard: (config = {}) => axiosClient.get('/api/admin/dashboard', config),
  getAdminProducts: (params = {}, config = {}) => axiosClient.get('/api/admin/products', { ...config, params }),
  createProduct: (product) => axiosClient.post('/api/admin/products', product),
  updateProduct: (id, product) => axiosClient.put(`/api/admin/products/${id}`, product),
  deleteProduct: (id) => axiosClient.delete(`/api/admin/products/${id}`),
  uploadProductImage: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(`/api/admin/products/${id}/image`, formData);
  },
  createCategory: (category) => axiosClient.post('/api/admin/categories', category),
  updateCategory: (id, category) => axiosClient.put(`/api/admin/categories/${id}`, category),
  deleteCategory: (id) => axiosClient.delete(`/api/admin/categories/${id}`),
  getAdminOrders: ({ page = 0, size = 10, status } = {}, config = {}) => axiosClient.get('/api/admin/orders', {
    ...config,
    params: { page, size, ...(status ? { status } : {}) },
  }),
  getAdminOrder: (id, config = {}) => axiosClient.get(`/api/admin/orders/${id}`, config),
  updateOrderStatus: (id, status) => axiosClient.put(`/api/admin/orders/${id}/status`, { status }),
};

export async function getAdminProduct(id) {
  let page = 0;
  let totalPages = 1;
  while (page < totalPages) {
    const { data } = await adminApi.getAdminProducts({ page, size: 50, sortBy: 'createdAt', sortDir: 'desc' });
    const product = data.content?.find((item) => String(item.id) === String(id));
    if (product) return product;
    totalPages = Math.max(data.totalPages || 0, page + (data.last ? 0 : 1));
    page += 1;
  }
  const error = new Error('Product not found.');
  error.response = { status: 404, data: { message: error.message } };
  throw error;
}

export default adminApi;
