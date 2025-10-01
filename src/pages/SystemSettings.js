import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSave } from 'react-icons/fi';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    systemName: '',
    companyName: '',
    emailNotifications: false,
    maintenanceMode: false,
    backupFrequency: 'daily',
    maxLoginAttempts: 3,
    sessionTimeout: 30,
    waterRate: 0,
    latePaymentFee: 0,
    dueDateGracePeriod: 3
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/settings');
      setSettings(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load settings. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:3001/api/settings', settings);
      showNotification('Settings saved successfully!', 'success');
    } catch (error) {
      showNotification('Failed to save settings. Please try again.', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg shadow-md text-sm font-semibold text-center
          ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {notification.message}
        </div>
      )}
      <div className="bg-white/80 rounded-2xl shadow p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-blue-900 mb-6">General Settings</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={settings.companyName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              value={settings.contactEmail || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="Enter contact email"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Water Rate (per cu.m.)</label>
            <input
              type="number"
              name="waterRate"
              value={settings.waterRate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="Enter water rate"
            />
          </div>
          <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
            <FiSave /> Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default SystemSettings; 