import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { FiLock, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = location.state?.resetToken;
    if (!token) {
      navigate('/forgot-password');
      return;
    }
    setResetToken(token);
  }, [location.state, navigate]);

  // Password strength checker
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'red' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'yellow' };
    if (strength <= 4) return { strength, label: 'Good', color: 'blue' };
    return { strength, label: 'Strong', color: 'green' };
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

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
      await apiClient.post('/auth/reset-password', {
        resetToken,
        newPassword: password
      });
      setSuccess('Password changed successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 transform transition-all duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <FiLock className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Set New Password</h1>
          <p className="text-gray-600">Create a strong password to secure your account</p>
        </div>

        {/* Instructions Box */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <FiAlertCircle className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-2">🔒 Password Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>At least 8 characters long</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
                <li>One special character (!@#$%...)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your new password"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Password Strength:</span>
                  <span className={`text-xs font-semibold text-${passwordStrength.color}-600`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${passwordStrength.color}-500 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            {confirm && password === confirm && (
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <FiCheckCircle className="w-3 h-3 mr-1" />
                Passwords match
              </p>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg animate-fade-in">
              <div className="flex items-center">
                <FiCheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-shake">
              <div className="flex items-center">
                <FiAlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !resetToken || passwordStrength.strength < 4 || password !== confirm}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Password...
              </>
            ) : (
              <>
                <FiCheckCircle className="w-5 h-5 mr-2" />
                Save New Password
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
