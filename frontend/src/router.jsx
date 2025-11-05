import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MarketplacePage from './pages/MarketplacePage.jsx';
import RequestsPage from './pages/RequestsPage.jsx';
import { useAuth } from './context/AuthContext.jsx';

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'dashboard', element: <Protected><DashboardPage /></Protected> },
      { path: 'marketplace', element: <Protected><MarketplacePage /></Protected> },
      { path: 'requests', element: <Protected><RequestsPage /></Protected> },
      { path: '*', element: <Navigate to="/login" replace /> }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

export default router;


