// src/App.tsx - Actualizado con sistema de redirecciones
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Landing Page
import { LandingPage } from './pages/LandingPage';

// Páginas de autenticación existentes
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Páginas de usuario existentes
import ProfilePage from './pages/User/ProfilePage';

// Nuevas páginas que vamos a crear
import { UserDashboard } from './pages/User/UserDashboard';
import { AdminDashboard } from './pages/Admin/AdminDashboard';

// Componente de carga
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
    </div>
  </div>
);

// Componente de ruta protegida
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere admin pero el usuario no es admin
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/user/dashboard" replace />;
  }

  return <>{children}</>;
};

// Componente para rutas de invitados (usuarios no autenticados)
interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Si el usuario ya está autenticado, redirigir a su dashboard
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Componente de redirección automática del dashboard según rol
const DashboardRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir según el rol del usuario
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else {
    return <Navigate to="/user/dashboard" replace />;
  }
};

// Rutas de la aplicación
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Ruta principal - Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Rutas de autenticación (solo para usuarios no autenticados) */}
      <Route 
        path="/login" 
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        } 
      />
      
      {/* Redirección automática del dashboard genérico */}
      <Route path="/dashboard" element={<DashboardRedirect />} />
      
      {/* Rutas protegidas de usuario */}
      <Route 
        path="/user/dashboard" 
        element={
          <ProtectedRoute>
            <UserDashboard />
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
      
      {/* Rutas de administración */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Rutas futuras de usuario */}
      <Route 
        path="/estaciones" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Mapa de Estaciones
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/transportes" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Lista de Transportes
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/prestamos" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Gestión de Préstamos
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      
      {/* Rutas futuras de administración */}
      <Route 
        path="/admin/usuarios" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Gestión de Usuarios
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/vehiculos" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Gestión de Vehículos
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/estaciones" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Gestión de Estaciones
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reportes" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Reportes y Estadísticas
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/finanzas" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Gestión Financiera
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/configuracion" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Configuración del Sistema
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      
      {/* Ruta 404 */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                  <div className="text-center">
                    {/* GIF agregado aquí */}
                    <div className="flex justify-center mb-8">
                      <img 
                        src="https://i.postimg.cc/2yrFyxKv/giphy.gif" 
                        alt="404 animation"
                        className="max-w-xs md:max-w-sm"
                      />
                    </div>
                    
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">Página no encontrada</p>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Volver al Inicio
                    </button>
                  </div>
                </div>
              } />
          </Routes>
  );
};

// Componente App principal
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;