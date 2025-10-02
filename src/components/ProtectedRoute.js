import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import apiClient from "../api/client";

function ProtectedRoute({ allowedRoles }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;
  const token = localStorage.getItem("token");
  const location = useLocation();

  const verifyToken = async () => {
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await apiClient.get("/auth/verify", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAuthenticated(response.data.valid);
    } catch (error) {
      console.error("Token verification failed:", error);
      setIsAuthenticated(false);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    }
  };

  // Verify token on initial load and route changes
  useEffect(() => {
    verifyToken();
  }, [location.pathname]); // Re-run verification when route changes

  // Re-verify when navigating with back/forward (bfcache) or tab visibility changes
  useEffect(() => {
    const handlePageShow = (event) => {
      // If page was restored from bfcache, re-verify auth
      if (event.persisted) {
        verifyToken();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        verifyToken();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !role) {
    // Clear any remaining auth data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Robust normalization for role comparison
  const normalizeRole = (r) => (r || '').toLowerCase().replace(/\s+/g, '_').trim();
  const normalizedRole = normalizeRole(role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  // Extra debug logging
  console.log("Raw role from localStorage:", role);
  console.log("Normalized role:", normalizedRole);
  console.log("Allowed roles:", allowedRoles);
  console.log("Normalized allowed roles:", normalizedAllowedRoles);
  console.log("Includes?", normalizedAllowedRoles.includes(normalizedRole));

  if (!normalizedAllowedRoles.includes(normalizedRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}

export default ProtectedRoute;
