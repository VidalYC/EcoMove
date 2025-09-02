import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { Loan, Station } from '../types';

export default function Loans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<Station[]>('/stations'),
      // Mock data for loans - replace with real API call
      Promise.resolve([
        {
          id: 1,
          user_id: user?.id || 1,
          transport_id: 1,
          origin_station_id: 1,
          destination_station_id: 2,
          duration_minutes: 30,
          cost: 3500,
          status: 'ACTIVO'
        },
        {
          id: 2,
          user_id: user?.id || 1,
          transport_id: 2,
          origin_station_id: 2,
          destination_station_id: 3,
          duration_minutes: 45,
          cost: 6800,
          status: 'COMPLETADO'
        }
      ] as Loan[])
    ])
    .then(([stationsData, loansData]) => {
      setStations(stationsData);
      setLoans(loansData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [user]);

  const getStationName = (id: number) => {
    const station = stations.find(s => s.id === id);
    return station?.name || `Estación ${id}`;
  };

  const filteredLoans = loans.filter(loan => {
    if (filter === 'active') return loan.status === 'ACTIVO';
    if (filter === 'completed') return loan.status === 'COMPLETADO';
    return true;
  });

  async function returnLoan(loanId: number) {
    try {
      const result = await api(`/loans/${loanId}/return`, { method: 'POST' });
      // Update loan status locally
      setLoans(prev => prev.map(loan => 
        loan.id === loanId ? { ...loan, status: 'COMPLETADO' } : loan
      ));
      console.log('Loan returned:', result);
    } catch (error) {
      console.error('Error returning loan:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Préstamos</h1>
            <p className="text-gray-600">Administra préstamos de transporte y gestiona pagos</p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Historial
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <span className="text-emerald-600 text-xl">🚲</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Préstamos Activos</p>
              <p className="text-lg font-bold text-emerald-600">
                {loans.filter(l => l.status === 'ACTIVO').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Total Préstamos</p>
              <p className="text-lg font-bold text-blue-600">{loans.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">💰</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Recaudación</p>
              <p className="text-lg font-bold text-green-600">
                ${loans.reduce((sum, loan) => sum + loan.cost, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-xl">⏱️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Tiempo Total</p>
              <p className="text-lg font-bold text-purple-600">
                {loans.reduce((sum, loan) => sum + loan.duration_minutes, 0)} min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historial de Préstamos</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transporte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estación Origen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estación Destino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Ana García</div>
                    <div className="text-sm text-gray-500">ana.garcia@email.com</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">🚲 Bicicleta</div>
                    <div className="text-sm text-gray-500">Centro Comercial Plaza</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getStationName(loan.origin_station_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getStationName(loan.destination_station_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    15/01/2025 07:30 a.m.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {loan.status === 'ACTIVO' ? '- Sin entregar' : '15/01/2025 08:15 a.m.'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    $ {loan.cost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loan.status === 'ACTIVO' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {loan.status === 'ACTIVO' ? 'Sin entregar' : 'Entregado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {loan.status === 'ACTIVO' ? (
                      <button
                        onClick={() => returnLoan(loan.id)}
                        className="text-emerald-600 hover:text-emerald-900 font-medium"
                      >
                        Devolver
                      </button>
                    ) : (
                      <span className="text-gray-400">Sin detalles</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLoans.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay préstamos</h3>
            <p className="text-gray-500">
              {filter === 'active' ? 'No tienes préstamos activos' :
               filter === 'completed' ? 'No hay préstamos completados' :
               'Aún no has realizado ningún préstamo'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}