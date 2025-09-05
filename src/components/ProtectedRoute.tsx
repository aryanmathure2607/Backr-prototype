import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../lib/store';

const ProtectedRoute: React.FC = () => {
  const { session } = useStore();

  if (session === undefined) {
    return <div>Loading...</div>; // Or a spinner
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
