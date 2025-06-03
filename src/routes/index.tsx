import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import DashboardPage from '../pages/DashboardPage';
import ImportPage from '../pages/ImportPage';
import SessionListPage from '../pages/SessionListPage';
import SessionDetailsPage from '../pages/SessionDetailsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import ProfilePage from '../pages/ProfilePage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <DashboardPage />
          </Layout>
        }
      />
      <Route
        path="/import"
        element={
          <Layout>
            <ImportPage />
          </Layout>
        }
      />
      <Route
        path="/sessions"
        element={
          <Layout>
            <SessionListPage />
          </Layout>
        }
      />
      <Route
        path="/sessions/:id"
        element={
          <Layout>
            <SessionDetailsPage />
          </Layout>
        }
      />
      <Route
        path="/analytics"
        element={
          <Layout>
            <AnalyticsPage />
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <Layout>
            <ProfilePage />
          </Layout>
        }
      />
    </Routes>
  );
};

export default AppRoutes; 