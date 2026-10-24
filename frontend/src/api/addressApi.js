import axiosClient from './axiosClient.js';

const ADDRESSES_URL = '/api/addresses';

const addressApi = {
  getAddresses: () => axiosClient.get(ADDRESSES_URL),
  createAddress: (address) => axiosClient.post(ADDRESSES_URL, address),
  updateAddress: (id, address) => axiosClient.put(`${ADDRESSES_URL}/${id}`, address),
  deleteAddress: (id) => axiosClient.delete(`${ADDRESSES_URL}/${id}`),
  setDefaultAddress: (id) => axiosClient.put(`${ADDRESSES_URL}/${id}/default`),
};

export default addressApi;
