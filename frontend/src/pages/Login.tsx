import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { useState } from "react";
import type { User } from "../types";

export default function Login() {
  const { login } = useAuth();
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");
  const [password, setPassword] = useState("");

  async function handle() {
    const u = await api<User>("/users", { method:"POST", body:JSON.stringify({ name, email, document, password }) });
    login(u);
  }

  return (
    <div style={{maxWidth:420, margin:"4rem auto"}}>
      <h2>EcoMove — Registro rápido</h2>
      <input placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Documento" value={document} onChange={e=>setDocument(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={handle}>Crear usuario e ingresar</button>
    </div>
  );
}
