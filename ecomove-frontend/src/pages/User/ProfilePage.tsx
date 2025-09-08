import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { User, Mail, FileText, Calendar, Activity, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useAuth();
  const { getUserLoans } = useData();
  const [activeTab, setActiveTab] = useState('info');

  if (!user) return null;

  const userLoans = getUserLoans(user.id);
  const completedLoans = userLoans.filter(l => l.status === 'completed');
  const totalSpent = completedLoans.reduce((sum, loan) => sum + loan.cost, 0);
  const totalTrips = completedLoans.length;
  const activeLoans = userLoans.filter(l => l.status === 'active').length;

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
                      <p className="text-gray-900">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Documento</label>
                      <p className="text-gray-900">{user.document}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Miembro desde</label>
                      <p className="text-gray-900">
                        {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: es })}
                      </p>
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
                  {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Total de viajes</p>
                      <p className="text-3xl font-bold text-emerald-900">{totalTrips}</p>
                    </div>
                    <Activity className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total gastado</p>
                      <p className="text-3xl font-bold text-blue-900">${totalSpent.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Préstamos activos</p>
                      <p className="text-3xl font-bold text-orange-900">{activeLoans}</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {completedLoans.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de actividad</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Promedio por viaje:</span>
                      <span className="font-medium">${(totalSpent / totalTrips).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duración promedio:</span>
                      <span className="font-medium">
                        {completedLoans.length > 0
                          ? Math.round(completedLoans.reduce((sum, loan) => sum + (loan.duration || 0), 0) / completedLoans.length)
                          : 0
                        } minutos
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}