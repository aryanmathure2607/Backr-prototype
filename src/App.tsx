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
import { useStore } from './lib/store';
import ProtectedRoute from './components/ProtectedRoute';
import CreateAdminEventPage from './pages/app/CreateAdminEventPage';
import ManageEventPage from './pages/app/ManageEventPage';
import { initializeApp } from 'firebase/app';

const App: React.FC = () => {
  const { session } = useStore();


  return (
    <ThemeProvider defaultTheme="dark" storageKey="backr-theme">
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={session ? <Navigate to="/app" replace /> : <SignUpPage />} />
          <Route path="/login" element={session ? <Navigate to="/app" replace /> : <LoginPage />} />
          
          {/* Protected Routes */}
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

          {/* Fallback Route */}
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
