import { useState } from "react";
import { api } from "../api/client";

export default function ReturnLoan() {
  const [loanId, setLoanId] = useState("");
  const [msg, setMsg] = useState("");

  async function closeLoan() {
    const r = await api(`/loans/${Number(loanId)}/return`, { method:"POST" });
    setMsg(`Devuelto. Pago ${r.payment.amount} por ${r.payment.method}`);
  }

  return (
    <div style={{padding:24}}>
      <h2>Devolver transporte</h2>
      <input placeholder="ID Préstamo" value={loanId} onChange={e=>setLoanId(e.target.value)} />
      <button onClick={closeLoan}>Cerrar préstamo</button>
      <p>{msg}</p>
    </div>
  );
}
