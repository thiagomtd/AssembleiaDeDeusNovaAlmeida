import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireGroup } from './components/RequireGroup';
import { useAuth } from './context/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Transacoes } from './pages/Transacoes';
import { Dizimistas } from './pages/Dizimistas';
import { Midia } from './pages/Midia';
import { MidiaCulto } from './pages/MidiaCulto';
import { Relatorios } from './pages/Relatorios';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Membros } from './pages/admin/Membros';
import { NovoMembro } from './pages/admin/NovoMembro';
import { EditarMembro } from './pages/admin/EditarMembro';
import { Lancamentos } from './pages/admin/Lancamentos';
import { NovoLancamento } from './pages/admin/NovoLancamento';
import { Cultos } from './pages/admin/Cultos';
import { Info } from './pages/admin/Info';

const QUALQUER_GRUPO = ['admin', 'member', 'midia', 'tesouraria'] as const;

function AdminIndex() {
  const { isAdmin, isTesouraria, isMidia } = useAuth();
  if (isAdmin) return <Navigate to="membros" replace />;
  if (isTesouraria) return <Navigate to="lancamentos" replace />;
  if (isMidia) return <Navigate to="cultos" replace />;
  return <Navigate to="/" replace />;
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="entrar" element={<Login />} />
        <Route path="recuperar-senha" element={<ForgotPassword />} />

        <Route path="entradas-saidas" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><Transacoes /></RequireGroup>} />
        <Route path="dizimistas" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><Dizimistas /></RequireGroup>} />
        <Route path="midia" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><Midia /></RequireGroup>} />
        <Route path="midia/:cultoId" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><MidiaCulto /></RequireGroup>} />
        <Route path="relatorios" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><Relatorios /></RequireGroup>} />

        <Route
          path="admin"
          element={
            <RequireGroup roles={['admin', 'midia', 'tesouraria']}>
              <AdminLayout />
            </RequireGroup>
          }
        >
          <Route index element={<AdminIndex />} />
          <Route path="membros" element={<RequireGroup roles={['admin']}><Membros /></RequireGroup>} />
          <Route path="membros/novo" element={<RequireGroup roles={['admin']}><NovoMembro /></RequireGroup>} />
          <Route path="membros/:id/editar" element={<RequireGroup roles={['admin']}><EditarMembro /></RequireGroup>} />
          <Route path="lancamentos" element={<RequireGroup roles={['admin', 'tesouraria']}><Lancamentos /></RequireGroup>} />
          <Route path="lancamentos/novo" element={<RequireGroup roles={['admin', 'tesouraria']}><NovoLancamento /></RequireGroup>} />
          <Route path="cultos" element={<RequireGroup roles={['admin', 'midia']}><Cultos /></RequireGroup>} />
          <Route path="info" element={<RequireGroup roles={['admin']}><Info /></RequireGroup>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
