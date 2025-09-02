import type { Transport } from '../types';

interface TransportListProps {
  transports: Transport[];
  onSelectTransport?: (transport: Transport) => void;
  selectedTransportId?: number;
}

export default function TransportList({ transports, onSelectTransport, selectedTransportId }: TransportListProps) {
  if (transports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-4xl mb-4">🚫</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay transportes disponibles</h3>
        <p className="text-gray-500">Por favor, selecciona otra estación o intenta más tarde.</p>
      </div>
    );
  }

  const groupedTransports = transports.reduce((acc, transport) => {
    if (!acc[transport.type]) {
      acc[transport.type] = [];
    }
    acc[transport.type].push(transport);
    return acc;
  }, {} as Record<string, Transport[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedTransports).map(([type, typeTransports]) => (
        <div key={type} className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="mr-2 text-xl">
                {type === 'BICICLETA' ? '🚲' : '🛴'}
              </span>
              {type === 'BICICLETA' ? 'Bicicletas' : 'Patinetas'}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({typeTransports.length} unidades)
              </span>
            </h3>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {typeTransports.map((transport) => (
                <div
                  key={transport.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTransportId === transport.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : transport.status === 'DISPONIBLE'
                      ? 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                  onClick={() => {
                    if (transport.status === 'DISPONIBLE' && onSelectTransport) {
                      onSelectTransport(transport);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">ID: {transport.id}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {type === 'BICICLETA' ? 'Bicicleta urbana' : 'Patineta eléctrica'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transport.status === 'DISPONIBLE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : transport.status === 'EN_USO'
                        ? 'bg-yellow-100 text-yellow-800'
                        : transport.status === 'MANTENIMIENTO'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {transport.status === 'DISPONIBLE' ? 'Disponible' :
                        transport.status === 'EN_USO' ? 'En uso' :
                        transport.status === 'MANTENIMIENTO' ? 'Mantenimiento' : transport.status}
                    </span>
                  </div>
                  
                  {transport.status === 'DISPONIBLE' && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Batería: 85%</span>
                        <span>Última revisión: Hoy</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}