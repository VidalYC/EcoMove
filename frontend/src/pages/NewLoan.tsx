import { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Loan } from "../types";

export default function NewLoan() {
  const { user } = useAuth();
  const [transportId, setTransportId] = useState("");
  const [origin, setOrigin] = useState(""); const [dest, setDest] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [loan, setLoan] = useState<Loan>();

  async function create() {
    const payload = {
      user_id: Number(user?.id),
      transport_id: Number(transportId),
      origin_station_id: Number(origin),
      destination_station_id: Number(dest),
      duration_minutes: Number(minutes)
    };
    const l = await api<Loan>("/loans", { method:"POST", body:JSON.stringify(payload) });
    setLoan(l);
  }

  return (
    <div style={{padding:24}}>
      <h2>Nuevo préstamo</h2>
      <input placeholder="ID Transporte" value={transportId} onChange={e=>setTransportId(e.target.value)} />
      <input placeholder="Estación Origen" value={origin} onChange={e=>setOrigin(e.target.value)} />
      <input placeholder="Estación Destino" value={dest} onChange={e=>setDest(e.target.value)} />
      <input placeholder="Minutos" value={minutes} onChange={e=>setMinutes(e.target.value)} />
      <button onClick={create} disabled={!user}>Prestar</button>
      {loan && <p>Costo: {loan.cost} — Estado: {loan.status}</p>}
    </div>
  );
}
