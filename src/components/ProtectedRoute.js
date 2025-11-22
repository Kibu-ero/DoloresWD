import React, { useEffect, useState, useCallback } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import apiClient from "../api/client";

function ProtectedRoute({ allowedRoles }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  // Get role from user object or fallback to localStorage role, then normalize
  const rawRole = user.role || localStorage.getItem("role") || "";
  const normalizeRole = (r) => (r || '').toString().trim().toLowerCase().replace(/\s+/g, '_');
  const role = normalizeRole(rawRole);
  const token = localStorage.getItem("token");
  const location = useLocation();

  const verifyToken = useCallback(async () => {
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
  }, [token]);

  // Verify token on initial load and route changes
  useEffect(() => {
    verifyToken();
  }, [location.pathname, verifyToken]); // Re-run verification when route changes

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
  }, [verifyToken]);

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

  // Robust normalization for role comparison (role is already normalized above)
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  // Extra debug logging
  console.log("ProtectedRoute - Raw role from localStorage:", rawRole);
  console.log("ProtectedRoute - Normalized role:", role);
  console.log("ProtectedRoute - Allowed roles:", allowedRoles);
  console.log("ProtectedRoute - Normalized allowed roles:", normalizedAllowedRoles);
  console.log("ProtectedRoute - Includes?", normalizedAllowedRoles.includes(role));
  console.log("ProtectedRoute - Current path:", location.pathname);

  if (!normalizedAllowedRoles.includes(role)) {
    console.error("ProtectedRoute - Access denied. Role:", role, "not in allowed roles:", normalizedAllowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}

export default ProtectedRoute;
