import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import DashboardPage from '../pages/DashboardPage';
import SessionListPage from '../pages/SessionListPage';
import SessionDetailsPage from '../pages/SessionDetailsPage';
import ImportPage from '../pages/ImportPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import ProfilePage from '../pages/ProfilePage';
import AdminPage from '../pages/AdminPage';
import Layout from '../components/Layout';
import { Box, CircularProgress, Typography } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const LoadingComponent = () => {
  const { error } = useAuth();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 2
      }}
    >
      <CircularProgress />
      <Typography variant="body1">
        Checking authentication...
      </Typography>
      {error && (
        <Typography color="error" variant="body2">
          Error: {error}
        </Typography>
      )}
    </Box>
  );
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading, error } = useAuth();

  if (loading) {
    return <LoadingComponent />;
  }

  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !user.is_admin) {
    console.log('User is not admin, redirecting to home');
    return <Navigate to="/" />;
  }

  if (!user.is_active) {
    console.log('User is not active, redirecting to login');
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <LoginPage />
          }
        />
        <Route
          path="/signup"
          element={
            user ? <Navigate to="/" replace /> : <SignUpPage />
          }
        />

        {/* Rotas privadas */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <PrivateRoute>
              <SessionListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sessions/:id"
          element={
            <PrivateRoute>
              <SessionDetailsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/import"
          element={
            <PrivateRoute>
              <ImportPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <AnalyticsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute requireAdmin>
              <AdminPage />
            </PrivateRoute>
          }
        />

        {/* Rota de fallback */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes; 