import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import apiClient from '../api/client';

const roleToPath = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return '/dashboard';
  if (r === 'cashier') return '/cashier-dashboard';
  if (r === 'customer') return '/customer-dashboard';
  if (r === 'encoder') return '/encoder-dashboard';
  if (r === 'finance_officer') return '/finance-dashboard';
  return '/unauthorized';
};

function PublicRoute({ children }) {
  const [checked, setChecked] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!token || !user?.role) {
        setChecked(true);
        return;
      }
      try {
        const res = await apiClient.get('/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.valid) {
          setRedirectPath(roleToPath(user.role));
        }
      } catch (_) {
        // token invalid → treat as public
      } finally {
        setChecked(true);
      }
    };
    verify();
  }, []);

  if (!checked) return null;
  if (redirectPath) return <Navigate to={redirectPath} replace />;
  return children;
}

export default PublicRoute;


