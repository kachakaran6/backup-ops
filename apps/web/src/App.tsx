import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ControlPlaneProvider } from './context/ControlPlaneContext';
import { AppRouter } from './router';

export function App() {
  return (
    <AuthProvider>
      <ControlPlaneProvider>
        <AppRouter />
      </ControlPlaneProvider>
    </AuthProvider>
  );
}

export default App;
