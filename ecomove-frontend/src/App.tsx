import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Landing Page
import { LandingPage } from './pages/LandingPage';

// Páginas de autenticación existentes
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Páginas de usuario existentes
import ProfilePage from './pages/User/ProfilePage';

// Componente de ruta protegida
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Aquí puedes agregar lógica de autenticación
  // Por ahora, simplemente retorna los children
  return <>{children}</>;
};

// Componente App principal - Principio de Inversión de Dependencias
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
            <Routes>
              {/* Ruta principal - Landing Page */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Rutas de autenticación */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Rutas protegidas de usuario */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Rutas futuras - Placeholder */}
              <Route path="/dashboard" element={<div>Dashboard - Próximamente</div>} />
              <Route path="/estaciones" element={<div>Mapa de Estaciones - Próximamente</div>} />
              <Route path="/transportes" element={<div>Lista de Transportes - Próximamente</div>} />
              <Route path="/prestamos" element={<div>Gestión de Préstamos - Próximamente</div>} />
              
              {/* Rutas de administración */}
              <Route path="/admin" element={<div>Panel de Administración - Próximamente</div>} />
              
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
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;