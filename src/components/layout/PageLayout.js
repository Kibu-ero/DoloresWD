import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import Notification from '../common/Notification';
import Sidebar from '../Sidebar';
import { NavLink } from 'react-router-dom';

const PageLayout = ({
  children,
  title,
  subtitle,
  userRole,
  sidebarItems = [],
  notification = null,
  onNotificationClose
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar: collapses on mobile */}
      <aside className={`fixed md:static z-30 ${sidebarOpen ? 'left-0' : '-left-64'} md:left-0 top-0 h-full w-64 bg-[#19213D] flex flex-col justify-between transition-all duration-300`}>
        <Sidebar userRole={userRole} onClose={() => setSidebarOpen(false)} />
      </aside>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-br from-blue-100 to-blue-200 p-2 sm:p-4 md:p-8 min-h-screen md:ml-64 transition-all duration-300">
        <button className="md:hidden fixed top-4 left-4 z-40 bg-blue-600 text-white p-2 rounded shadow-lg" onClick={() => setSidebarOpen(true)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="max-w-7xl mx-auto w-full">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm md:text-base text-gray-600">{subtitle}</p>
              )}
            </div>
          )}
          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={onNotificationClose}
            />
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageLayout; 