import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type Grupo } from '../context/AuthContext';
import { Card } from './ui';
import { IconLock } from './icons';

export function RequireGroup({ roles, children }: { roles: Grupo[]; children: ReactNode }) {
  const { loading, isAuthenticated, grupos } = useAuth();
  const location = useLocation();

  if (loading) return <div className="py-20 text-center text-muted text-sm">Carregando...</div>;

  // Visitante (sem sessão): manda direto pro login, guardando a página pretendida
  // para voltar exatamente pra cá depois que a pessoa entrar.
  if (!isAuthenticated) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  const allowed = grupos.some((g) => roles.includes(g));
  if (!allowed) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="text-center py-14 px-6">
          <IconLock className="icon w-9 h-9 mx-auto mb-3 text-muted" />
          <h2 className="text-xl font-serif mb-2 text-ink">Acesso restrito</h2>
          <p className="text-inkSecondary text-sm mb-5 max-w-[38ch] mx-auto">
            Esta área não está disponível para o seu grupo de acesso.
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
