import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { FiKey, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';

const VerifyResetOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    const pn = location.state?.phoneNumber || '';
    if (!pn) {
      navigate('/forgot-password');
      return;
    }
    setPhoneNumber(pn);
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location.state, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/otp/verify-reset', { phoneNumber, otp });
      navigate('/reset-password', { state: { phoneNumber, resetToken: data.resetToken } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify OTP. Please try again.');
      setOtp(''); // Clear OTP on error
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/otp/start-reset', { phoneNumber });
      setTimeLeft(300); // Reset timer
      alert('New OTP sent! Please check your phone.');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 transform transition-all duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <FiKey className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Enter Verification Code</h1>
          <p className="text-gray-600">We sent a code to</p>
          <p className="text-gray-800 font-semibold mt-1">{phoneNumber || 'your phone'}</p>
        </div>

        {/* Instructions Box */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <FiAlertCircle className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-2">🔐 Verification Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Check your SMS messages for a 6-digit code</li>
                <li>Enter the code exactly as received</li>
                <li>Code expires in 5 minutes</li>
                <li>Didn't receive it? Click "Resend OTP" below</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Timer */}
        {timeLeft > 0 && (
          <div className="flex items-center justify-center mb-4 text-sm text-gray-600">
            <FiClock className="w-4 h-4 mr-2" />
            <span className="font-semibold">Code expires in: {formatTime(timeLeft)}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Enter 6-Digit OTP Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
                setError('');
              }}
              placeholder="000000"
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Enter all 6 digits from your SMS
            </p>
          </div>

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
            disabled={loading || otp.length !== 6}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <FiCheckCircle className="w-5 h-5 mr-2" />
                Verify Code
              </>
            )}
          </button>

          {/* Resend OTP */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || timeLeft > 240}
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Didn't receive the code? <span className="font-semibold underline">Resend OTP</span>
            </button>
          </div>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/forgot-password"
            className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Change Phone Number
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default VerifyResetOTP;
