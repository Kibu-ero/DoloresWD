import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = location.state?.resetToken;
    if (!token) {
      // If no token, redirect back to forgot password
      navigate('/forgot-password');
      return;
    }
    setResetToken(token);
  }, [location.state, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    
    if (!resetToken) {
      setError('Reset token missing. Please start over.');
      navigate('/forgot-password');
      return;
    }
    
    setLoading(true);
    try {
      // Backend extracts phoneNumber from resetToken - no need to send it
      await apiClient.post('/auth/reset-password', { 
        resetToken, 
        newPassword: password 
      });
      setSuccess('Password changed. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-6">
        <h1 className="text-xl font-semibold mb-4">Set New Password</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">New Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border rounded px-3 py-2" 
              required 
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
            <input 
              type="password" 
              value={confirm} 
              onChange={(e) => setConfirm(e.target.value)} 
              className="w-full border rounded px-3 py-2" 
              required 
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
          <button 
            type="submit" 
            disabled={loading || !resetToken} 
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;


