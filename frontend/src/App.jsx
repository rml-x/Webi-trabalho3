import { Routes, Route, Navigate } from 'react-router-dom';
import Cliente from './pages/Cliente.jsx';
import Login from './pages/Login.jsx';
import Painel from './pages/Painel.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Cliente />} />
      <Route path="/painel/login" element={<Login />} />
      <Route path="/painel" element={<Painel />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
