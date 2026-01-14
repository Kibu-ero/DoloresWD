import React, { useState, useEffect } from 'react';
import SettingsService from '../services/settings.service';
import { FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    system_name: '',
    company_name: '',
    contact_email: '',
    email_notifications: false,
    maintenance_mode: false,
    backup_frequency: 'daily',
    max_login_attempts: 3,
    session_timeout: 30,
    water_rate: 0,
    late_payment_fee: 0,
    due_date_grace_period: 3,
    senior_citizen_discount: 5
  });
  const [waterRates, setWaterRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [newRate, setNewRate] = useState({
    consumption_min: '',
    consumption_max: '',
    rate_per_cubic_meter: '',
    fixed_amount: ''
  });

  useEffect(() => {
    fetchSettings();
    fetchWaterRates();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await SettingsService.getSettings();
      setSettings(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setLoading(false);
    }
  };

  const fetchWaterRates = async () => {
    try {
      const data = await SettingsService.getWaterRates();
      setWaterRates(Array.isArray(data) ? data : data?.rates || []);
    } catch (error) {
      console.error('Failed to load water rates:', error);
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
      const updated = await SettingsService.updateSettings(settings);
      // Use updated settings from backend if returned; otherwise keep local state
      if (updated) {
        setSettings(updated);
      } else {
        // Fallback: refetch to ensure we stay in sync with server
        fetchSettings();
      }
      showNotification('Settings saved successfully!', 'success');
    } catch (error) {
      showNotification('Failed to save settings. Please try again.', 'error');
    }
  };

  const handleWaterRatesSubmit = async (e) => {
    e.preventDefault();
    try {
      // Normalize values before sending
      const normalized = waterRates
        .filter(r => r && r.consumption_min !== '' && r.consumption_min !== null && r.consumption_min !== undefined)
        .map(r => ({
          consumption_min: Number(r.consumption_min),
          consumption_max: r.consumption_max === '' ? null : (r.consumption_max === undefined ? null : Number(r.consumption_max)),
          rate_per_cubic_meter: r.rate_per_cubic_meter === '' ? null : (r.rate_per_cubic_meter === undefined ? null : Number(r.rate_per_cubic_meter)),
          fixed_amount: r.fixed_amount === '' ? null : (r.fixed_amount === undefined ? null : Number(r.fixed_amount))
        }));

      if (!normalized.length) {
        showNotification('Add at least one rate before saving.', 'error');
        return;
      }

      // Send raw array so backend can consume it easily; also include "rates" wrapper
      // for backwards compatibility with older controller shapes.
      const payload = { rates: normalized, data: normalized };
      await SettingsService.updateWaterRates(payload);
      showNotification('Water rates updated successfully!', 'success');
      fetchWaterRates();
    } catch (error) {
      showNotification('Failed to update water rates. Please try again.', 'error');
    }
  };

  const addNewRate = () => {
    if (newRate.consumption_min && (newRate.rate_per_cubic_meter || newRate.fixed_amount)) {
      const rate = {
        consumption_min: parseInt(newRate.consumption_min),
        consumption_max: newRate.consumption_max ? parseInt(newRate.consumption_max) : null,
        rate_per_cubic_meter: newRate.rate_per_cubic_meter ? parseFloat(newRate.rate_per_cubic_meter) : null,
        fixed_amount: newRate.fixed_amount ? parseFloat(newRate.fixed_amount) : null
      };
      setWaterRates([...waterRates, rate]);
      setNewRate({ consumption_min: '', consumption_max: '', rate_per_cubic_meter: '', fixed_amount: '' });
    }
  };

  const updateRateField = (index, field, value) => {
    setWaterRates(prev => prev.map((rate, i) => i === index ? { ...rate, [field]: value } : rate));
  };

  const removeRate = (index) => {
    setWaterRates(waterRates.filter((_, i) => i !== index));
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
    <div className="w-full max-w-6xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg shadow-md text-sm font-semibold text-center
          ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {notification.message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white/80 rounded-2xl shadow p-8 border border-gray-200 mb-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'general' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('water-rates')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'water-rates' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Water Rates
          </button>
        </div>

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-6">General Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* System / Company identity */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">System Name</label>
                <input
                  type="text"
                  name="system_name"
                  value={settings.system_name || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter system name (e.g. Dolores Water Billing)"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={settings.company_name || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Contact Email</label>
                <input
                  type="email"
                  name="contact_email"
                  value={settings.contact_email || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter contact email"
                />
              </div>

              {/* Global base water rate (optional helper for backend) */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Base Water Rate (₱ per cu.m.)</label>
                <input
                  type="number"
                  step="0.01"
                  name="water_rate"
                  value={settings.water_rate || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter base water rate"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Late Payment Fee (₱)</label>
                <input
                  type="number"
                  name="late_payment_fee"
                  value={settings.late_payment_fee || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter late payment fee"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Due Date Grace Period (days)</label>
                <input
                  type="number"
                  name="due_date_grace_period"
                  value={settings.due_date_grace_period || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter grace period"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Senior Citizen Discount (%)</label>
                <input
                  type="number"
                  name="senior_citizen_discount"
                  value={settings.senior_citizen_discount || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter discount percentage"
                />
              </div>

              {/* Email + security toggles */}
              <div className="flex items-center space-x-3">
                <input
                  id="email_notifications"
                  type="checkbox"
                  name="email_notifications"
                  checked={!!settings.email_notifications}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="email_notifications" className="text-gray-700 font-medium">
                  Enable Email Notifications
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  id="maintenance_mode"
                  type="checkbox"
                  name="maintenance_mode"
                  checked={!!settings.maintenance_mode}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="maintenance_mode" className="text-gray-700 font-medium">
                  Enable Maintenance Mode
                </label>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Max Login Attempts</label>
                <input
                  type="number"
                  name="max_login_attempts"
                  value={settings.max_login_attempts || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="e.g. 5"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  name="session_timeout"
                  value={settings.session_timeout || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="e.g. 30"
                />
              </div>
            </div>
            
            <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
              <FiSave /> Save Changes
            </button>
          </form>
        )}

        {/* Water Rates Tab */}
        {activeTab === 'water-rates' && (
          <div>
            <h3 className="text-xl font-semibold text-blue-900 mb-6">Water Rates Management</h3>
            
            {/* Current Rates Table */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Current Water Rates</h4>
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Min (cu.m.)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Max (cu.m.)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rate per cu.m. (₱)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fixed Amount (₱)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {waterRates.map((rate, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <input
                            type="number"
                            value={rate.consumption_min ?? ''}
                            onChange={(e) => updateRateField(index, 'consumption_min', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <input
                            type="number"
                            value={rate.consumption_max ?? ''}
                            onChange={(e) => updateRateField(index, 'consumption_max', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded"
                            placeholder="∞"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <input
                            type="number"
                            step="0.01"
                            value={rate.rate_per_cubic_meter ?? ''}
                            onChange={(e) => updateRateField(index, 'rate_per_cubic_meter', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <input
                            type="number"
                            step="0.01"
                            value={rate.fixed_amount ?? ''}
                            onChange={(e) => updateRateField(index, 'fixed_amount', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => removeRate(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add New Rate Form */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Add New Rate</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Consumption</label>
                  <input
                    type="number"
                    value={newRate.consumption_min}
                    onChange={(e) => setNewRate({...newRate, consumption_min: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Consumption</label>
                  <input
                    type="number"
                    value={newRate.consumption_max}
                    onChange={(e) => setNewRate({...newRate, consumption_max: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="20 (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate per cu.m. (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRate.rate_per_cubic_meter}
                    onChange={(e) => setNewRate({...newRate, rate_per_cubic_meter: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="30.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRate.fixed_amount}
                    onChange={(e) => setNewRate({...newRate, fixed_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="500.00"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={addNewRate}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-2"
                >
                  <FiPlus className="w-4 h-4" /> Add Rate
                </button>
                <button
                  type="button"
                  onClick={handleWaterRatesSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <FiSave className="w-4 h-4" /> Save All Rates
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings; 
