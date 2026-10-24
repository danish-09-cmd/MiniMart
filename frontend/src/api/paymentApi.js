import axiosClient from './axiosClient.js';

const paymentApi = {
  mockPayment: ({ orderId, method, cardNumber }) => axiosClient.post('/api/payments/mock', {
    orderId,
    method,
    ...(cardNumber ? { cardNumber } : {}),
  }),
};

export default paymentApi;
