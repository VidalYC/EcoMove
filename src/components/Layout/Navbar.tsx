import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Leaf, User, Settings, LogOut, MapPin, History } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const userLinks = [
    { to: '/stations', label: 'Estaciones', icon: MapPin },
    { to: '/history', label: 'Historial', icon: History },
    { to: '/profile', label: 'Perfil', icon: User }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: Settings },
    { to: '/admin/stations', label: 'Estaciones', icon: MapPin },
    { to: '/admin/vehicles', label: 'Vehículos', icon: Settings },
    { to: '/admin/users', label: 'Usuarios', icon: User }
  ];

  const links = user?.role === 'admin' ? adminLinks : userLinks;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/stations'} className="flex items-center space-x-2">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="p-2 bg-emerald-500 rounded-lg"
              >
                <Leaf className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-2xl font-bold text-gray-900">EcoMove</span>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Hola, {user?.name}
              </span>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}