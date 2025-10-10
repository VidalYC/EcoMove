import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, User, Mail, Phone, FileText, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../UI/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        telefono: user.telefono || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      showError('Error', 'No se pudo identificar el usuario. Por favor, inicia sesión nuevamente.');
      return;
    }

    if (!formData.nombre.trim()) {
      showError('Campo Requerido', 'El nombre es obligatorio');
      return;
    }

    // Validar nombre (solo letras y espacios)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!nameRegex.test(formData.nombre)) {
      showError('Nombre Inválido', 'El nombre solo puede contener letras y espacios');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('ecomove_token');
      
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
      }
      
      const response = await fetch(`http://localhost:4000/api/v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          telefono: formData.telefono.trim() || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Si es error de autorización, sugerir re-login
        if (response.status === 401 || response.status === 403) {
          throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(result.message || 'Error al actualizar el perfil');
      }

      if (result.success) {
        // Actualizar el contexto de autenticación
        await updateProfile({
          nombre: formData.nombre.trim(),
          telefono: formData.telefono.trim() || undefined
        });

        showSuccess('Perfil Actualizado', 'Tus datos se han actualizado correctamente');
        setIsEditing(false);
      } else {
        throw new Error(result.message || 'No se pudo actualizar el perfil');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Si es error de token, cerrar modal y pedir re-login
      if (error.message.includes('sesión') || error.message.includes('token')) {
        showError('Sesión Expirada', error.message);
        onClose();
      } else {
        showError('Error', error.message || 'No se pudo actualizar el perfil');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        telefono: user.telefono || '',
      });
    }
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Mi Perfil</h2>
                    <p className="text-emerald-100">Gestiona tu información personal</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Información de Solo Lectura */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-blue-500" />
                        Información Protegida
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            Correo Electrónico
                          </label>
                          <div className="bg-gray-100 dark:bg-gray-600 rounded-lg px-4 py-3 text-gray-600 dark:text-gray-300">
                            {user.correo}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Este campo no puede ser modificado
                          </p>
                        </div>

                        {/* Documento */}
                        {user.documento && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-gray-400" />
                              Documento de Identidad
                            </label>
                            <div className="bg-gray-100 dark:bg-gray-600 rounded-lg px-4 py-3 text-gray-600 dark:text-gray-300">
                              {user.documento}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Este campo no puede ser modificado
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información Editable */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <User className="h-5 w-5 mr-2 text-emerald-500" />
                          Información Personal
                        </h3>
                        
                        {!isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="flex items-center space-x-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span>Editar</span>
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Nombre */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre Completo *
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="nombre"
                              value={formData.nombre}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                              placeholder="Tu nombre completo"
                              required
                              disabled={isSubmitting}
                            />
                          ) : (
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-900 dark:text-white">
                              {user.nombre}
                            </div>
                          )}
                        </div>

                        {/* Teléfono */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            Teléfono
                          </label>
                          {isEditing ? (
                            <input
                              type="tel"
                              name="telefono"
                              value={formData.telefono}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                              placeholder="Número de teléfono"
                              disabled={isSubmitting}
                            />
                          ) : (
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-900 dark:text-white">
                              {user.telefono || 'No especificado'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Información Adicional */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-purple-500" />
                        Información de Cuenta
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {/* Rol */}
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rol</p>
                          <p className="text-base font-medium text-gray-900 dark:text-white capitalize">
                            {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  {isEditing && (
                    <div className="flex space-x-3 mt-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Guardando...</span>
                          </div>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Cambios
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};