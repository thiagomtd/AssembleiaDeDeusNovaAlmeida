import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Emblem, IconMenu, IconX } from './icons';
import { Button } from './ui';

const navItems = [
  { to: '/', label: 'Início', role: null as null | 'member' | 'admin' },
  { to: '/entradas-saidas', label: 'Entradas e Saídas', role: 'member' as const },
  { to: '/dizimistas', label: 'Dizimistas do Mês', role: 'member' as const },
  { to: '/aniversariantes', label: 'Aniversariantes', role: 'member' as const },
  { to: '/midia', label: 'Mídia do Culto', role: 'member' as const },
  { to: '/relatorios', label: 'Relatórios', role: 'member' as const },
  { to: '/meu-extrato', label: 'Meu Extrato', role: 'member' as const },
  { to: '/campanhas', label: 'Campanhas', role: 'member' as const },
  { to: '/admin', label: 'Administração', role: 'admin' as const },
];

export function Layout() {
  const { isMember, isAdmin, isMidia, isTesouraria, isAuthenticated, telefone, nome, signOut } = useAuth();
  const nomeExibido = nome || telefone;
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const canSee = (role: null | 'member' | 'admin') => {
    if (role === null) return true;
    // "Administração" no menu aparece para quem tem qualquer responsabilidade
    // de gestão (diretoria, mídia ou tesouraria) — cada uma vê só as suas abas lá dentro.
    if (role === 'admin') return isAdmin || isMidia || isTesouraria;
    return isMember;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const visibleItems = navItems.filter((item) => canSee(item.role));

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    `px-2.5 py-2 text-[13.5px] border-b-2 transition-colors ${
      isActive ? 'text-ink border-accent font-semibold' : 'text-inkSecondary border-transparent hover:text-ink'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-surface border-b border-border">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-5 py-2.5 flex items-center gap-4">
          <div className="flex items-center gap-2.5 mr-auto min-w-0">
            <Emblem className="w-[34px] h-[34px] flex-none" />
            <div className="flex flex-col leading-tight min-w-0">
              <strong className="font-serif text-[14.5px] text-ink truncate">Assembleia de Deus</strong>
              <span className="text-[10.5px] text-muted uppercase tracking-wider truncate">Nova Almeida</span>
            </div>
          </div>

          <nav className="hidden md:flex gap-0.5">
            {visibleItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkCls}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2.5 text-[12.5px] text-muted flex-none">
            {isAuthenticated ? (
              <>
                <span className="max-w-[180px] truncate">{nomeExibido}</span>
                <Button variant="secondary" size="sm" onClick={handleSignOut}>
                  Sair
                </Button>
              </>
            ) : (
              <NavLink to="/entrar">
                <Button variant="gold" size="sm">
                  Entrar
                </Button>
              </NavLink>
            )}
          </div>

          <button
            className="md:hidden flex-none w-9 h-9 rounded-lg border border-border flex items-center justify-center text-inkSecondary"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <IconX className="icon w-[18px] h-[18px]" /> : <IconMenu className="icon w-[18px] h-[18px]" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 sm:px-5 py-3 flex flex-col gap-0.5">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-lg text-[14px] ${isActive ? 'bg-surface2 text-ink font-semibold' : 'text-inkSecondary'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 pt-3 border-t border-border flex items-center justify-between gap-2.5">
              {isAuthenticated ? (
                <>
                  <span className="text-[12.5px] text-muted truncate">{nomeExibido}</span>
                  <Button variant="secondary" size="sm" onClick={handleSignOut}>
                    Sair
                  </Button>
                </>
              ) : (
                <NavLink to="/entrar" className="w-full">
                  <Button variant="gold" size="sm" className="w-full justify-center">
                    Entrar
                  </Button>
                </NavLink>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-[1180px] mx-auto px-4 sm:px-5 pt-6 sm:pt-7 pb-16 w-full">
        <Outlet />
      </main>

      <footer className="text-center py-6 text-[11.5px] text-muted px-4 flex flex-col items-center gap-1.5">
        <span>Assembleia de Deus de Nova Almeida</span>
        <NavLink to="/privacidade" className="text-inkSecondary hover:text-ink underline underline-offset-2">
          Privacidade e Proteção de Dados
        </NavLink>
      </footer>
    </div>
  );
}
