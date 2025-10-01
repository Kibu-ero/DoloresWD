import apiClient from '../api/client';

const CustomerService = {
  async getCustomers(params = {}) {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  async getCustomerById(id) {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  async createCustomer(customerData) {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  },

  async updateCustomer(id, customerData) {
    const response = await apiClient.put(`/customers/${id}`, customerData);
    return response.data;
  },

  async deleteCustomer(id) {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },

  async getCustomerBills(customerId) {
    const response = await apiClient.get(`/customers/${customerId}/bills`);
    return response.data;
  },

  async getCustomerPayments(customerId) {
    const response = await apiClient.get(`/customers/${customerId}/payments`);
    return response.data;
  },

  async searchCustomers(query) {
    const response = await apiClient.get('/customers/search', { params: { query } });
    return response.data;
  }
};

export default CustomerService; 