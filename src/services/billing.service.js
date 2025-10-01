import apiClient from '../api/client';

const BillingService = {
  async getBills(params = {}) {
    const response = await apiClient.get('/billing', { params });
    return response.data;
  },

  async getBillById(id) {
    const response = await apiClient.get(`/billing/${id}`);
    return response.data;
  },

  async getBillByCustomerId(customerId) {
    const response = await apiClient.get(`/billing/customer/${customerId}`);
    return response.data;
  },

  async createBill(billData) {
    const response = await apiClient.post('/billing', billData);
    return response.data;
  },

  async updateBill(id, billData) {
    const response = await apiClient.put(`/billing/${id}`, billData);
    return response.data;
  },

  async deleteBill(id) {
    const response = await apiClient.delete(`/billing/${id}`);
    return response.data;
  },

  async getBillingReports(params = {}) {
    const response = await apiClient.get('/billing/reports', { params });
    return response.data;
  },

  async processPayment(billId, paymentData) {
    const response = await apiClient.post(`/billing/${billId}/payment`, paymentData);
    return response.data;
  },

  async getPaymentHistory(billId) {
    const response = await apiClient.get(`/billing/${billId}/payments`);
    return response.data;
  }
};

export default BillingService; 