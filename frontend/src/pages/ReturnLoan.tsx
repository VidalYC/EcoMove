import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Loan, Station } from "../types";

interface ReturnResponse {
  payment: {
    amount: number;
    method: string;
  };
}

export default function ReturnLoan() {
  const { user } = useAuth();
  const [loanId, setLoanId] = useState("");
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [returnStation, setReturnStation] = useState("");
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api<Station[]>('/stations'),
      // Mock active loans - replace with real API call
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
        }
      ] as Loan[])
    ])
    .then(([stationsData, loansData]) => {
      setStations(stationsData);
      setActiveLoans(loansData.filter(loan => loan.status === 'ACTIVO'));
    })
    .catch(console.error);
  }, [user]);

  const handleLoanSelect = (loan: Loan) => {
    setSelectedLoan(loan);
    setLoanId(loan.id.toString());
  };

  async function closeLoan() {
    if (!selectedLoan || !returnStation) return;
    
    setLoading(true);
    try {
      const r = await api<ReturnResponse>(`/loans/${selectedLoan.id}/return`, { method: "POST" });
      setMsg(`¡Devuelto exitosamente! Pago de $${r.payment.amount.toLocaleString()} procesado por ${r.payment.method}`);
      setSuccess(true);
      setActiveLoans(prev => prev.filter(loan => loan.id !== selectedLoan.id));
      setSelectedLoan(null);
      setLoanId("");
      setReturnStation("");
    } catch (error) {
      setMsg("Error al procesar la devolución. Intenta nuevamente.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  const getStationName = (id: number) => {
    const station = stations.find(s => s.id === id);
    return station?.name || `Estación ${id}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Devolver Transporte</h1>
        <p className="text-gray-600">Finaliza tu viaje y procesa el pago</p>
      </div>

      {success && msg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-lg">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-emerald-900">Devolución exitosa</h4>
              <p className="text-emerald-700 text-sm mt-1">{msg}</p>
            </div>
          </div>
        </div>
      )}

      {!success && (
        <>
          {/* Método 1: Selección por ID */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresa el ID del préstamo</h3>
            <div className="flex space-x-3">
              <input
                type="number"
                placeholder="ID Préstamo"
                value={loanId}
                onChange={(e) => {
                  setLoanId(e.target.value);
                  setSelectedLoan(null);
                }}
                className="flex-1 px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                onClick={() => {
                  const loan = activeLoans.find(l => l.id === Number(loanId));
                  if (loan) setSelectedLoan(loan);
                }}
                disabled={!loanId}
                className="px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Método 2: Selección de lista */}
          {activeLoans.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                O selecciona de tus préstamos activos
              </h3>
              <div className="space-y-3">
                {activeLoans.map((loan) => (
                  <div
                    key={loan.id}
                    onClick={() => handleLoanSelect(loan)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedLoan?.id === loan.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">Préstamo #{loan.id}</p>
                        <p className="text-sm text-gray-600">
                          Transporte #{loan.transport_id} • {loan.duration_minutes} minutos
                        </p>
                        <p className="text-sm text-gray-600">
                          {getStationName(loan.origin_station_id)} → {getStationName(loan.destination_station_id)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Activo
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          ${loan.cost.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selección de estación de retorno */}
          {selectedLoan && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estación de devolución</h3>
              <select
                value={returnStation}
                onChange={(e) => setReturnStation(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Selecciona la estación donde entregas el transporte</option>
                {stations.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.name} — {station.location}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Resumen y confirmación */}
          {selectedLoan && returnStation && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de devolución</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Préstamo:</span>
                  <span className="font-medium">#{selectedLoan.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transporte:</span>
                  <span className="font-medium">#{selectedLoan.transport_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estación origen:</span>
                  <span className="font-medium">{getStationName(selectedLoan.origin_station_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estación retorno:</span>
                  <span className="font-medium">{getStationName(Number(returnStation))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duración:</span>
                  <span className="font-medium">{selectedLoan.duration_minutes} minutos</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-gray-900 font-medium">Costo total:</span>
                  <span className="text-emerald-600 font-bold">${selectedLoan.cost.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={closeLoan}
                disabled={loading}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Procesando devolución..." : "Confirmar devolución"}
              </button>
            </div>
          )}
        </>
      )}

      {!success && msg && !success && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-lg">!</span>
            </div>
            <p className="text-red-700">{msg}</p>
          </div>
        </div>
      )}
    </div>
  );
}