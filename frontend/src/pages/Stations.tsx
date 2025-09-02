import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Station, Transport } from "../types";

export default function Stations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selected, setSelected] = useState<number>();
  const [avail, setAvail] = useState<Transport[]>([]);

  useEffect(() => { api<Station[]>("/stations").then(setStations); }, []);
  async function check() {
    if (!selected) return;
    const r = await api<{ station_id:number; transports: Transport[] }>(`/stations/${selected}/availability`);
    setAvail(r.transports);
  }

  return (
    <div style={{padding:24}}>
      <h2>Estaciones</h2>
      <select onChange={e=>setSelected(Number(e.target.value))}>
        <option>Selecciona estación</option>
        {stations.map(s=> <option key={s.id} value={s.id}>{s.name} — {s.location}</option>)}
      </select>
      <button onClick={check}>Consultar disponibilidad</button>
      <ul>
        {avail.map(t=> <li key={t.id}>{t.type} — {t.status} (ID {t.id})</li>)}
      </ul>
    </div>
  );
}
