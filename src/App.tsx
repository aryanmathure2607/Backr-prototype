// App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './hooks/useTheme';

import LandingPage from './pages/LandingPage';
import MainApp from './pages/app/MainApp';
import FindEventsPage from './pages/app/FindEventsPage';
import CreateEventPage from './pages/app/CreateEventPage';
import ProfilePage from './pages/app/ProfilePage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import EventDetailPage from './pages/app/EventDetailPage';
import CreateAdminEventPage from './pages/app/CreateAdminEventPage';
import ManageEventPage from './pages/app/ManageEventPage';

import ProtectedRoute from './components/ProtectedRoute';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebase';
import { useStore } from '../src/lib/store';

// Loader while Firebase auth hydrates
function AuthLoading() {
  return <div className="p-6">Checking session…</div>;
}

// Public pages that should redirect to /app only if user is actually logged in
function PublicAuthRoute({ children }: { children: JSX.Element }) {
  const { authReady, firebaseUser } = useStore();
  if (!authReady) return <AuthLoading />;
  return firebaseUser ? <Navigate to="/app" replace /> : children;
}

const App: React.FC = () => {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      useStore.getState().setAuthFromFirebase(user);
    });
    return () => unsub();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="backr-theme">
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/signup"
            element={
              <PublicAuthRoute>
                <SignUpPage />
              </PublicAuthRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicAuthRoute>
                <LoginPage />
              </PublicAuthRoute>
            }
          />

          {/* Protected (ProtectedRoute checks authReady + firebaseUser and renders <Outlet/>) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<MainApp />}>
              <Route index element={<Navigate to="find" replace />} />
              <Route path="find" element={<FindEventsPage />} />
              <Route path="create" element={<CreateEventPage />} />
              <Route path="create-admin-event" element={<CreateAdminEventPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="event/:eventId" element={<EventDetailPage />} />
              <Route path="event/:eventId/manage" element={<ManageEventPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      <Toaster
        position="bottom-center"
        reverseOrder={false}
        toastOptions={{
          className: 'font-sans',
          style: {
            background: '#1A1D2E',
            color: '#FFFFFF',
            border: '1px solid #2C3149',
          },
        }}
      />
    </ThemeProvider>
  );
};

export default App;
