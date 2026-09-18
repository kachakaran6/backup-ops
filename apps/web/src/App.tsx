import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ControlPlaneProvider } from './context/ControlPlaneContext';
import { AppRouter } from './router';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ControlPlaneProvider>
          <AppRouter />
        </ControlPlaneProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
