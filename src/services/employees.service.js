import apiClient from '../api/client';

const EmployeesService = {
  async getEmployees(params = {}) {
    const response = await apiClient.get('/employees', { params });
    return response.data;
  },

  async getEmployeeById(id) {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  async createEmployee(employeeData) {
    const response = await apiClient.post('/employees', employeeData);
    return response.data;
  },

  async updateEmployee(id, employeeData) {
    const response = await apiClient.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  async deleteEmployee(id) {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  },

  async assignRole(employeeId, role) {
    const response = await apiClient.post(`/employees/${employeeId}/role`, { role });
    return response.data;
  },

  async updatePermissions(employeeId, permissions) {
    const response = await apiClient.put(`/employees/${employeeId}/permissions`, { permissions });
    return response.data;
  },

  async resetPassword(employeeId) {
    const response = await apiClient.post(`/employees/${employeeId}/reset-password`);
    return response.data;
  },

  async getEmployeeActivity(employeeId) {
    const response = await apiClient.get(`/employees/${employeeId}/activity`);
    return response.data;
  }
};

export default EmployeesService; 