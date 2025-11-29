import apiClient from '../api/client';

const SettingsService = {
  async getSettings() {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  async updateSettings(settings) {
    const response = await apiClient.put('/settings', settings);
    return response.data;
  },

  async getWaterRates() {
    const response = await apiClient.get('/settings/water-rates');
    return response.data;
  },

  async updateWaterRates(body) {
    const response = await apiClient.put('/settings/water-rates', body);
    return response.data;
  },

  async getPaymentSettings() {
    const response = await apiClient.get('/settings/payment');
    return response.data;
  },

  async updatePaymentSettings(settings) {
    const response = await apiClient.put('/settings/payment', settings);
    return response.data;
  },

  async getNotificationSettings() {
    const response = await apiClient.get('/settings/notifications');
    return response.data;
  },

  async updateNotificationSettings(settings) {
    const response = await apiClient.put('/settings/notifications', settings);
    return response.data;
  },

  async getSystemBackupSettings() {
    const response = await apiClient.get('/settings/backup');
    return response.data;
  },

  async updateSystemBackupSettings(settings) {
    const response = await apiClient.put('/settings/backup', settings);
    return response.data;
  },

  async initiateBackup() {
    const response = await apiClient.post('/settings/backup/start');
    return response.data;
  },

  async getBackupHistory() {
    const response = await apiClient.get('/settings/backup/history');
    return response.data;
  }
};

export default SettingsService; 
