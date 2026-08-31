import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireGroup } from './components/RequireGroup';
import { useAuth } from './context/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';

// Paginas menos acessadas (admin, relatorios com Recharts, etc.) carregam sob demanda —
// reduz o bundle inicial, que pesa principalmente pra quem acessa pelo celular.
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const Transacoes = lazy(() => import('./pages/Transacoes').then((m) => ({ default: m.Transacoes })));
const Dizimistas = lazy(() => import('./pages/Dizimistas').then((m) => ({ default: m.Dizimistas })));
const Aniversariantes = lazy(() => import('./pages/Aniversariantes').then((m) => ({ default: m.Aniversariantes })));
const MeuExtrato = lazy(() => import('./pages/MeuExtrato').then((m) => ({ default: m.MeuExtrato })));
const Campanhas = lazy(() => import('./pages/Campanhas').then((m) => ({ default: m.Campanhas })));
const AdminCampanhas = lazy(() => import('./pages/admin/Campanhas').then((m) => ({ default: m.Campanhas })));
const NovaCampanha = lazy(() => import('./pages/admin/NovaCampanha').then((m) => ({ default: m.NovaCampanha })));
const EditarCampanha = lazy(() => import('./pages/admin/EditarCampanha').then((m) => ({ default: m.EditarCampanha })));
const Auditoria = lazy(() => import('./pages/admin/Auditoria').then((m) => ({ default: m.Auditoria })));
const Privacidade = lazy(() => import('./pages/Privacidade').then((m) => ({ default: m.Privacidade })));
const Midia = lazy(() => import('./pages/Midia').then((m) => ({ default: m.Midia })));
const MidiaCulto = lazy(() => import('./pages/MidiaCulto').then((m) => ({ default: m.MidiaCulto })));
const Relatorios = lazy(() => import('./pages/Relatorios').then((m) => ({ default: m.Relatorios })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const Membros = lazy(() => import('./pages/admin/Membros').then((m) => ({ default: m.Membros })));
const NovoMembro = lazy(() => import('./pages/admin/NovoMembro').then((m) => ({ default: m.NovoMembro })));
const EditarMembro = lazy(() => import('./pages/admin/EditarMembro').then((m) => ({ default: m.EditarMembro })));
const Lancamentos = lazy(() => import('./pages/admin/Lancamentos').then((m) => ({ default: m.Lancamentos })));
const NovoLancamento = lazy(() => import('./pages/admin/NovoLancamento').then((m) => ({ default: m.NovoLancamento })));
const EditarLancamento = lazy(() => import('./pages/admin/EditarLancamento').then((m) => ({ default: m.EditarLancamento })));
const Cultos = lazy(() => import('./pages/admin/Cultos').then((m) => ({ default: m.Cultos })));
const Info = lazy(() => import('./pages/admin/Info').then((m) => ({ default: m.Info })));

const QUALQUER_GRUPO = ['admin', 'member', 'midia', 'tesouraria', 'secretario'] as const;

function AdminIndex() {
  const { isAdmin, isTesouraria, isMidia, isSecretario } = useAuth();
  if (isAdmin) return <Navigate to="membros" replace />;
  if (isSecretario) return <Navigate to="membros" replace />;
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
        <Route path="privacidade" element={<Privacidade />} />

        <Route path="entradas-saidas" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><Transacoes /></RequireGroup>} />
        <Route path="dizimistas" element={<RequireGroup roles={['admin', 'tesouraria']}><Dizimistas /></RequireGroup>} />
        <Route path="aniversariantes" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><Aniversariantes /></RequireGroup>} />
        <Route path="midia" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><Midia /></RequireGroup>} />
        <Route path="midia/:cultoId" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><MidiaCulto /></RequireGroup>} />
        <Route path="relatorios" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><Relatorios /></RequireGroup>} />
        <Route path="meu-extrato" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><MeuExtrato /></RequireGroup>} />
        <Route path="campanhas" element={<RequireGroup roles={[...QUALQUER_GRUPO]}><Campanhas /></RequireGroup>} />

        <Route
          path="admin"
          element={
            <RequireGroup roles={['admin', 'midia', 'tesouraria', 'secretario']}>
              <AdminLayout />
            </RequireGroup>
          }
        >
          <Route index element={<AdminIndex />} />
          <Route path="membros" element={<RequireGroup roles={['admin', 'secretario']}><Membros /></RequireGroup>} />
          <Route path="membros/novo" element={<RequireGroup roles={['admin', 'secretario']}><NovoMembro /></RequireGroup>} />
          <Route path="membros/:id/editar" element={<RequireGroup roles={['admin', 'secretario']}><EditarMembro /></RequireGroup>} />
          <Route path="lancamentos" element={<RequireGroup roles={['admin', 'tesouraria']}><Lancamentos /></RequireGroup>} />
          <Route path="lancamentos/novo" element={<RequireGroup roles={['admin', 'tesouraria']}><NovoLancamento /></RequireGroup>} />
          <Route path="lancamentos/:mes/:id/editar" element={<RequireGroup roles={['admin', 'tesouraria']}><EditarLancamento /></RequireGroup>} />
          <Route path="campanhas" element={<RequireGroup roles={['admin', 'tesouraria']}><AdminCampanhas /></RequireGroup>} />
          <Route path="campanhas/nova" element={<RequireGroup roles={['admin', 'tesouraria']}><NovaCampanha /></RequireGroup>} />
          <Route path="campanhas/:id/editar" element={<RequireGroup roles={['admin', 'tesouraria']}><EditarCampanha /></RequireGroup>} />
          <Route path="cultos" element={<RequireGroup roles={['admin', 'midia']}><Cultos /></RequireGroup>} />
          <Route path="info" element={<RequireGroup roles={['admin', 'secretario']}><Info /></RequireGroup>} />
          <Route path="auditoria" element={<RequireGroup roles={['admin']}><Auditoria /></RequireGroup>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
