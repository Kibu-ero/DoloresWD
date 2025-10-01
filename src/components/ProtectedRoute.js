import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";

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
      const response = await axios.get("http://localhost:3001/api/auth/verify", {
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
