import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Loan, Station, Transport } from "../types";

export default function NewLoan() {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: estaciones, 2: transporte, 3: confirmación

  useEffect(() => {
    api<Station[]>("/stations").then(setStations).catch(console.error);
  }, []);

  useEffect(() => {
    if (origin) {
      api<{ station_id: number; transports: Transport[] }>(`/stations/${origin}/availability`)
        .then(result => setTransports(result.transports.filter(t => t.status === 'DISPONIBLE')))
        .catch(() => setTransports([]));
    }
  }, [origin]);

  async function createLoan() {
    if (!selectedTransport || !origin || !dest) return;
    
    setLoading(true);
    try {
      const payload = {
        user_id: Number(user?.id),
        transport_id: selectedTransport.id,
        origin_station_id: Number(origin),
        destination_station_id: Number(dest),
        duration_minutes: Number(minutes)
      };
      const l = await api<Loan>("/loans", { 
        method: "POST", 
        body: JSON.stringify(payload) 
      });
      setLoan(l);
      setStep(4); // Ir a confirmación final
    } catch (error) {
      console.error("Error creating loan:", error);
    } finally {
      setLoading(false);
    }
  }

  const getStationName = (id: string) => {
    const station = stations.find(s => s.id === Number(id));
    return station ? station.name : `Estación ${id}`;
  };

  const calculateCost = () => {
    const baseRate = selectedTransport?.type === 'BICICLETA' ? 100 : 150; // Por minuto
    return baseRate * Number(minutes);
  };

  if (loan) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Préstamo confirmado!</h2>
          <p className="text-gray-600 mb-6">Tu transporte está listo para usar</p>
          
          <div className="text-left space-y-3 mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">ID Préstamo:</span>
              <span className="text-sm font-medium">#{loan.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Transporte:</span>
              <span className="text-sm font-medium">#{loan.transport_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Duración:</span>
              <span className="text-sm font-medium">{loan.duration_minutes} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Costo:</span>
              <span className="text-sm font-medium text-emerald-600">${loan.cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Estado:</span>
              <span className="text-sm font-medium text-emerald-600">{loan.status}</span>
            </div>
          </div>

          <button 
            onClick={() => {setLoan(null); setStep(1); setSelectedTransport(null);}}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700"
          >
            Crear otro préstamo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {stepNum}
              </div>
              <span className={`ml-2 text-sm ${
                step >= stepNum ? 'text-emerald-600 font-medium' : 'text-gray-500'
              }`}>
                {stepNum === 1 ? 'Estaciones' : stepNum === 2 ? 'Transporte' : 'Confirmar'}
              </span>
              {stepNum < 3 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  step > stepNum ? 'bg-emerald-500' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          {step === 1 ? 'Selecciona las estaciones' : 
           step === 2 ? 'Elige tu transporte' : 
           'Confirma tu préstamo'}
        </h1>
        <p className="text-gray-600">
          {step === 1 ? 'Elige tu punto de origen y destino' :
           step === 2 ? 'Selecciona el transporte disponible' :
           'Revisa los detalles antes de confirmar'}
        </p>
      </div>

      {/* Step 1: Selección de estaciones */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estación de Origen</h3>
            <select 
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Selecciona origen</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name} — {s.location}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estación Destino</h3>
            <select 
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Selecciona destino</option>
              {stations.filter(s => s.id !== Number(origin)).map(s => (
                <option key={s.id} value={s.id}>{s.name} — {s.location}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Duración estimada</h3>
              <div className="flex space-x-4">
                {['15', '30', '45', '60'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setMinutes(time)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      minutes === time
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {time} min
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Minutos personalizados"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!origin || !dest}
                className="px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Selección de transporte */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Transportes disponibles en {getStationName(origin)}
            </h3>
            
            {transports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {transports.map((transport) => (
                  <div
                    key={transport.id}
                    onClick={() => setSelectedTransport(transport)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTransport?.id === transport.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">
                        {transport.type === 'BICICLETA' ? '🚲' : '🛴'}
                      </div>
                      <h4 className="font-medium text-gray-900">ID: {transport.id}</h4>
                      <p className="text-sm text-gray-600">{transport.type}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">
                        Disponible
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay transportes disponibles en esta estación</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Anterior
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedTransport}
              className="px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmación */}
      {step === 3 && selectedTransport && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Confirma tu préstamo
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Usuario:</span>
                <span className="font-medium">{user?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Transporte:</span>
                <span className="font-medium">
                  {selectedTransport.type === 'BICICLETA' ? '🚲' : '🛴'} #{selectedTransport.id}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Origen:</span>
                <span className="font-medium">{getStationName(origin)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Destino:</span>
                <span className="font-medium">{getStationName(dest)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Duración:</span>
                <span className="font-medium">{minutes} minutos</span>
              </div>
              <div className="flex justify-between py-3 bg-emerald-50 rounded-lg px-3">
                <span className="text-emerald-700 font-medium">Costo total:</span>
                <span className="text-emerald-700 font-bold text-lg">
                  ${calculateCost().toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Anterior
              </button>
              <button
                onClick={createLoan}
                disabled={loading || !user}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Procesando..." : "Confirmar préstamo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}