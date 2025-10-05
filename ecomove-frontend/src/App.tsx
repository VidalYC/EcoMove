// src/App.tsx - ACTUALIZADO CON RUTA DE GESTIÓN DE USUARIOS
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationContainer } from './components/UI/NotificationContainer';

// Landing Page
import { LandingPage } from './pages/LandingPage';

// Páginas de autenticación existentes
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Páginas de usuario existentes
import ProfilePage from './pages/User/ProfilePage';

// Páginas principales
import { UserDashboard } from './pages/User/UserDashboard';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement'; // ← NUEVA IMPORTACIÓN
import  VehicleManagement  from './pages/Admin/VehicleManagement';
import { RentVehicle } from './pages/User/RentVehicle';
import { VehicleList } from './components/Vehicle/VehicleList';
import { Bike } from 'lucide-react';

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/user/dashboard" replace />;
  }

  return <>{children}</>;
};

// Componente para rutas de invitados
interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

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
      
      {/* Rutas de autenticación */}
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
        path="/user/rent" 
        element={
          <ProtectedRoute>
            <RentVehicle />
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
      
      {/* ✅ NUEVA RUTA - Gestión de Usuarios */}
      <Route 
        path="/admin/usuarios" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <UserManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* Otras rutas de usuario */}
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between py-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                        <Bike className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Lista de Transportes
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                          Encuentra el vehículo perfecto para tu viaje
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <VehicleList
                  onRent={async (vehicleId, stationId) => {
                    console.log('Renting vehicle:', vehicleId, 'from station:', stationId);
                    alert(`Funcionalidad de alquiler en desarrollo. Vehículo: ${vehicleId}, Estación: ${stationId}`);
                  }}
                  showOnlyAvailable={true}
                />
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      
      {/* Rutas de administración adicionales */}
      <Route 
        path="/admin/vehiculos" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <VehicleManagement />
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
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
              <AppRoutes />
              <NotificationContainer />
            </div>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;