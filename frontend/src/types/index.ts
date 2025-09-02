export type User = { id: number; name: string; email: string; document: string; role: "USER"|"ADMIN" };
export type Station = { id: number; name: string; location: string };
export type Transport = { id: number; type: "BICICLETA"|"PATINETA"; status: string; station_id: number };
export type Loan = {
  id: number; user_id: number; transport_id: number;
  origin_station_id: number; destination_station_id: number;
  duration_minutes: number; cost: number; status: string;
};
