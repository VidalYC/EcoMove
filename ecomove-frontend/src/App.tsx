// src/App.tsx - VERSIÓN COMPLETA
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// User pages
import StationsPage from './pages/User/StationsPage';
import HistoryPage from './pages/User/HistoryPage';
import ProfilePage from './pages/User/ProfilePage';

// Admin pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminStations from './pages/Admin/AdminStations';

function AppRoutes() {
  const { user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* User routes */}
        <Route 
          path="/stations" 
          element={
            <ProtectedRoute>
              <StationsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        {/* Admin routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/stations" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminStations />
            </ProtectedRoute>
          } 
        />

        {/* Default redirects */}
        <Route 
          path="/" 
          element={
            <Navigate 
              to={user.role === 'admin' ? '/admin/dashboard' : '/stations'} 
              replace 
            />
          } 
        />
        <Route 
          path="*" 
          element={
            <Navigate 
              to={user.role === 'admin' ? '/admin/dashboard' : '/stations'} 
              replace 
            />
          } 
        />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <AppRoutes />
          </Router>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}