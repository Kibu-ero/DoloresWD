import apiClient from '../api/client';
import axios from 'axios';

const API_URL = '/reports';

class ReportsService {
  // Collection summary with grouping
  static async getCollectionSummary(startDate, endDate, groupBy = 'day') {
    const response = await apiClient.get(`${API_URL}/collection-summary`, {
      params: { startDate, endDate, groupBy },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  }

  // Outstanding balances
  static async getOutstanding(startDate, endDate) {
    const response = await apiClient.get(`${API_URL}/outstanding`, {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  }

  // Revenue report
  static async getRevenue(startDate, endDate) {
    const response = await apiClient.get(`${API_URL}/revenue`, {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  }

  // Monthly statistics
  static async getMonthlyStats(startDate, endDate) {
    const response = await apiClient.get(`${API_URL}/monthly-stats`, {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  }

  // Ledger
  static async getLedger(startDate, endDate, customerId) {
    const response = await apiClient.get(`${API_URL}/ledger`, {
      params: { startDate, endDate, customerId },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  }
  // Get overview report
  static async getOverviewReport(startDate, endDate) {
    try {
      const response = await apiClient.get(`${API_URL}/overview`, {
        params: { startDate, endDate },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching overview report:', error);
      throw error;
    }
  }

  // Get customer ledger
  static async getCustomerLedger(startDate, endDate, customerId = null) {
    try {
      const params = { startDate, endDate };
      if (customerId) params.customerId = customerId;
      
      const response = await apiClient.get(`${API_URL}/ledger`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer ledger:', error);
      throw error;
    }
  }

  // Get audit logs
  static async getAuditLogs(startDate, endDate) {
    try {
      const response = await apiClient.get(`${API_URL}/audit`, {
        params: { startDate, endDate },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  // Get transaction logs
  static async getTransactionLogs(startDate, endDate) {
    try {
      const response = await apiClient.get(`${API_URL}/transactions`, {
        params: { startDate, endDate },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction logs:', error);
      throw error;
    }
  }

  // Get approval logs
  static async getApprovalLogs(startDate, endDate) {
    try {
      const response = await apiClient.get(`${API_URL}/approvals`, {
        params: { startDate, endDate },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching approval logs:', error);
      throw error;
    }
  }

  // Export report
  static async exportReport(type, data) {
    try {
      const response = await axios.post(`${API_URL}/export/${type}`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  // Get customers for filter dropdown
  static async getCustomers() {
    try {
      const response = await apiClient.get('/customers');
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }
}

export default ReportsService; 
