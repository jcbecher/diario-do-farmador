import React, { useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';

const AppContent: React.FC = () => {
  const { mode } = useTheme();

  useEffect(() => {
    document.body.setAttribute('data-theme', mode);
  }, [mode]);

  return <AppRoutes />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 