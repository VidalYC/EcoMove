// ⚙️ ROUTER CONFIGURATION
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../presentation/pages/LoginPage';
import { RegisterPage } from '../presentation/pages/RegisterPage';

// Placeholder components - will be implemented later
const DashboardPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <p>Welcome to EcoMove Dashboard!</p>
  </div>
);

const ProfilePage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Profile</h1>
    <p>User profile page</p>
  </div>
);

const LoansPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Loans</h1>
    <p>Loan history and active loans</p>
  </div>
);

const AdminPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Admin</h1>
    <p>Admin dashboard</p>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('auth-store') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('auth-store') !== null;
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export const router = createBrowserRouter([
  // Root redirect
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  
  // Public routes
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  
  // Protected routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/loans',
    element: (
      <ProtectedRoute>
        <LoansPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/loans/new',
    element: (
      <ProtectedRoute>
        <div className="p-8">
          <h1 className="text-2xl font-bold">New Loan</h1>
          <p>Create new loan page</p>
        </div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminPage />
      </ProtectedRoute>
    ),
  },
  
  // Catch all - 404
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-4">Page not found</p>
          <a 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Go back to dashboard
          </a>
        </div>
      </div>
    ),
  },
]);