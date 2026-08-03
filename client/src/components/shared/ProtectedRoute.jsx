import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/signin" replace />;
  }

  try {
    const user = JSON.stringify(userStr) ? JSON.parse(userStr) : null;
    
    if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
      // Redirect to home if they don't have the right role
      return <Navigate to="/" replace />;
    }
    
    return <Outlet />;
  } catch (err) {
    console.error('Failed to parse user session', err);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/signin" replace />;
  }
};

export default ProtectedRoute;
