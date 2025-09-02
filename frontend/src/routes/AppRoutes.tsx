import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "../pages/Login";
import Stations from "../pages/Stations";
import NewLoan from "../pages/NewLoan";
import ReturnLoan from "../pages/ReturnLoan";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <nav style={{display:"flex", gap:12, padding:12}}>
        <Link to="/">Login</Link>
        <Link to="/stations">Estaciones</Link>
        <Link to="/loan/new">Nuevo préstamo</Link>
        <Link to="/loan/return">Devolver</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/loan/new" element={<NewLoan />} />
        <Route path="/loan/return" element={<ReturnLoan />} />
      </Routes>
    </BrowserRouter>
  );
}
