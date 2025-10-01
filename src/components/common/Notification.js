import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';

const Notification = ({ type = 'success', message, onClose }) => {
  const styles = {
    success: {
      container: 'bg-green-50 border-green-500',
      icon: 'text-green-500',
      text: 'text-green-700'
    },
    error: {
      container: 'bg-red-50 border-red-500',
      icon: 'text-red-500',
      text: 'text-red-700'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-500',
      icon: 'text-yellow-500',
      text: 'text-yellow-700'
    }
  };

  const Icon = type === 'success' ? FiCheckCircle : FiAlertCircle;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full`}>
      <div className={`${styles[type].container} border-l-4 p-4 rounded-lg shadow-lg`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${styles[type].icon}`} />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${styles[type].text}`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification; 