import React, { useState, useEffect } from 'react';
import { FiClock, FiLogOut } from 'react-icons/fi';

const IdleTimeoutWarning = ({ 
  isOpen, 
  onStaySignedIn, 
  onSignOut, 
  warningTime = 30 // seconds
}) => {
  const [secondsLeft, setSecondsLeft] = useState(warningTime);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(warningTime);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onSignOut(); // Auto logout when countdown reaches 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, warningTime, onSignOut]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay - non-clickable */}
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full sm:max-w-md">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiClock className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">
                  Session Timeout Warning
                </h3>
                <div className="text-sm text-yellow-700 mb-4">
                  <p className="mb-2">
                    You've been inactive for a while. For your security, you'll be automatically 
                    logged out in:
                  </p>
                  <div className="flex items-center justify-center bg-yellow-100 rounded-lg p-3 mb-4">
                    <div className="text-2xl font-bold text-yellow-800">
                      {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                    </div>
                  </div>
                  <p className="text-xs">
                    Click "Stay Signed In" to continue your session.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={onSignOut}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 flex items-center justify-center"
              >
                <FiLogOut className="w-4 h-4 mr-2" />
                Sign Out Now
              </button>
              <button
                onClick={onStaySignedIn}
                className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 font-medium"
              >
                Stay Signed In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdleTimeoutWarning;