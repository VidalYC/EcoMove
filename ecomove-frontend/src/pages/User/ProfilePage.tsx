// src/pages/User/ProfilePage.tsx - INTEGRADO CON API REAL
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api.service';
import { User, Mail, FileText, Calendar, Activity, DollarSign, Clock, Phone } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface UserStats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  totalSpent: number;
  averageDuration: number;
}

interface UserLoan {
  id: number;
  userId: number;
  transportId: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  cost: number;
  duration?: number;
  transport?: {
    type: string;
    code: string;
    brand: string;
  };
  originStation?: {
    name: string;
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userLoans, setUserLoans] = useState<UserLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para formatear fechas de forma segura
  const formatDateSafe = (dateValue: any): string => {
    try {
      let date: Date;
      
      if (!dateValue) {
        return 'Fecha no disponible';
      }
      
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        // Intentar parsear como ISO string
        date = parseISO(dateValue);
        if (!isValid(date)) {
          // Si no es ISO, intentar crear Date directamente
          date = new Date(dateValue);
        }
      } else {
        date = new Date(dateValue);
      }
      
      if (!isValid(date)) {
        return 'Fecha no disponible';
      }
      
      return format(date, 'dd MMMM yyyy', { locale: es });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha no disponible';
    }
  };

  // Cargar datos del usuario desde la API
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Cargar préstamos del usuario (si existe el endpoint)
        try {
          const loansResponse = await apiService.getUserLoans();
          if (loansResponse.success && loansResponse.data) {
            setUserLoans(loansResponse.data);
            
            // Calcular estadísticas
            const loans = loansResponse.data;
            const completedLoans = loans.filter(l => l.status === 'completed');
            const activeLoans = loans.filter(l => l.status === 'active');
            
            const totalSpent = completedLoans.reduce((sum, loan) => sum + (loan.cost || 0), 0);
            const totalDuration = completedLoans.reduce((sum, loan) => sum + (loan.duration || 0), 0);
            const averageDuration = completedLoans.length > 0 ? totalDuration / completedLoans.length : 0;
            
            setUserStats({
              totalLoans: loans.length,
              activeLoans: activeLoans.length,
              completedLoans: completedLoans.length,
              totalSpent,
              averageDuration
            });
          }
        } catch (loansError) {
          console.log('Loans endpoint not available yet:', loansError);
          // No mostrar error si el endpoint no existe aún
        }
        
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Error al cargar los datos del usuario');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Obtener la fecha de registro del usuario con múltiples fallbacks
  const userCreatedAt = user.createdAt || user.registrationDate || (user as any).fechaRegistro || new Date();
  const memberSince = formatDateSafe(userCreatedAt);

  const tabs = [
    { id: 'info', label: 'Información Personal', icon: User },
    { id: 'stats', label: 'Estadísticas', icon: Activity }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información y revisa tus estadísticas</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header del usuario */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-emerald-100">
                {user.role === 'admin' ? 'Administrador' : 'Usuario'} • 
                Miembro desde {memberSince}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                      <p className="text-gray-900">{user.name || 'No disponible'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                      <p className="text-gray-900">{user.email || 'No disponible'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Documento</label>
                      <p className="text-gray-900">{user.document || 'No especificado'}</p>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                        <p className="text-gray-900">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Miembro desde</label>
                      <p className="text-gray-900">{memberSince}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
                </div>

                {user.status && (
                  <div className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? '✅ Activo' : '❌ Inactivo'}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Error al cargar estadísticas
                  </h3>
                  <p className="text-gray-600">{error}</p>
                </div>
              ) : userStats ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Préstamos Totales</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-900 mt-2">{userStats.totalLoans}</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Total Gastado</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 mt-2">
                        ${userStats.totalSpent.toLocaleString('es-CO')}
                      </p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Préstamos Activos</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-900 mt-2">{userStats.activeLoans}</p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Duración Promedio</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 mt-2">
                        {Math.round(userStats.averageDuration)} min
                      </p>
                    </div>
                  </div>

                  {userLoans.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Historial Reciente</h4>
                      <div className="space-y-3">
                        {userLoans.slice(0, 5).map((loan) => (
                          <div key={loan.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {loan.transport ? `${loan.transport.type} ${loan.transport.brand}` : `Préstamo #${loan.id}`}
                              </p>
                              <p className="text-xs text-gray-600">
                                {formatDateSafe(loan.startDate)} - {loan.originStation?.name || 'Estación no especificada'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                ${loan.cost.toLocaleString('es-CO')}
                              </p>
                              <p className={`text-xs px-2 py-1 rounded-full ${
                                loan.status === 'completed' ? 'bg-green-100 text-green-800' :
                                loan.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {loan.status === 'completed' ? 'Completado' :
                                 loan.status === 'active' ? 'Activo' : 'Cancelado'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aún no has realizado préstamos
                  </h3>
                  <p className="text-gray-600">
                    ¡Ve a la sección de estaciones para empezar tu primer viaje!
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}