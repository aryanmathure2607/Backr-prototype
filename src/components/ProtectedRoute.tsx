import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../lib/store';

const ProtectedRoute: React.FC = () => {
  const { authReady, firebaseUser } = useStore(); // from your store.ts
  const location = useLocation();

  // Wait until Firebase onAuthStateChanged fires and store hydrates
  if (!authReady) return <div className="p-6">Checking session…</div>;

  // Not signed in → send to login, keep intended path
  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Signed in → render nested route
  return <Outlet />;
};

export default ProtectedRoute;
