import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Emblem, IconMenu, IconX, IconChevronDown } from './icons';
import { Button } from './ui';

interface NavLeaf {
  to: string;
  label: string;
}
interface NavGroup {
  label: string;
  items: NavLeaf[];
}

function financeiroPara(podeVerDizimistas: boolean): NavGroup {
  return {
    label: 'Financeiro',
    items: [
      { to: '/entradas-saidas', label: 'Entradas e Saídas' },
      ...(podeVerDizimistas ? [{ to: '/dizimistas', label: 'Dizimistas do Mês' }] : []),
      { to: '/relatorios', label: 'Relatórios' },
      { to: '/meu-extrato', label: 'Meu Extrato' },
      { to: '/campanhas', label: 'Metas' },
    ],
  };
}

const comunidade: NavGroup = {
  label: 'Comunidade',
  items: [
    { to: '/aniversariantes', label: 'Aniversariantes' },
    { to: '/midia', label: 'Mídia do Culto' },
  ],
};

function NavDropdown({ group, openLabel, setOpenLabel }: { group: NavGroup; openLabel: string | null; setOpenLabel: (l: string | null) => void }) {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = openLabel === group.label;
  const isActiveGroup = group.items.some((i) => location.pathname.startsWith(i.to));

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenLabel(null);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen, setOpenLabel]);

  return (
    <div ref={ref} className="relative flex-none">
      <button
        type="button"
        onClick={() => setOpenLabel(isOpen ? null : group.label)}
        className={`flex items-center gap-1 whitespace-nowrap px-2.5 py-2 text-[13.5px] border-b-2 transition-colors ${
          isOpen || isActiveGroup ? 'text-ink border-accent font-semibold' : 'text-inkSecondary border-transparent hover:text-ink'
        }`}
      >
        {group.label}
        <IconChevronDown className={`icon w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 min-w-[180px] bg-surface border border-border rounded-xl shadow-card overflow-hidden py-1 z-30">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpenLabel(null)}
              className={({ isActive }) =>
                `block px-3.5 py-2.5 text-[13px] ${isActive ? 'bg-surface2 text-ink font-semibold' : 'text-inkSecondary hover:bg-surface2 hover:text-ink'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const { isMember, isAdmin, isMidia, isTesouraria, isAuthenticated, loading, telefone, nome, signOut } = useAuth();
  const nomeExibido = nome ? nome.split(' ')[0] : telefone;
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setOpenGroup(null);
  }, [location.pathname]);

  const podeVerAdmin = isAdmin || isMidia || isTesouraria;
  const memberGroups = [financeiroPara(isAdmin || isTesouraria), comunidade];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    `flex-none whitespace-nowrap px-2.5 py-2 text-[13.5px] border-b-2 transition-colors ${
      isActive ? 'text-ink border-accent font-semibold' : 'text-inkSecondary border-transparent hover:text-ink'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-surface border-b border-border">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-5 py-2.5 flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-2.5 mr-auto min-w-0">
            <Emblem className="w-[34px] h-[34px] flex-none" />
            <div className="flex flex-col leading-tight min-w-0">
              <strong className="font-serif text-[14.5px] text-ink truncate">Assembleia de Deus</strong>
              <span className="text-[10.5px] text-muted uppercase tracking-wider truncate">Nova Almeida</span>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-0.5">
            <NavLink to="/" end className={navLinkCls}>
              Início
            </NavLink>
            {isMember &&
              memberGroups.map((g) => (
                <NavDropdown key={g.label} group={g} openLabel={openGroup} setOpenLabel={setOpenGroup} />
              ))}
            {podeVerAdmin && (
              <NavLink to="/admin" className={navLinkCls}>
                Administração
              </NavLink>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2.5 text-[12.5px] text-muted flex-none">
            {!loading && (isAuthenticated ? (
              <>
                <span className="max-w-[180px] truncate">Olá, {nomeExibido}</span>
                <Button variant="secondary" size="sm" onClick={handleSignOut}>
                  Sair
                </Button>
              </>
            ) : (
              <NavLink to="/entrar">
                <Button variant="info" size="sm">
                  Entrar
                </Button>
              </NavLink>
            ))}
          </div>

          {!loading && (isAuthenticated ? (
            <>
              <span className="md:hidden flex-none max-w-[130px] truncate text-[12.5px] text-muted">Olá, {nomeExibido}</span>
              <button
                className="md:hidden flex-none w-9 h-9 rounded-lg border border-border flex items-center justify-center text-inkSecondary"
                aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? <IconX className="icon w-[18px] h-[18px]" /> : <IconMenu className="icon w-[18px] h-[18px]" />}
              </button>
            </>
          ) : (
            <NavLink to="/entrar" className="md:hidden flex-none">
              <Button variant="info" size="sm">
                Entrar
              </Button>
            </NavLink>
          ))}
        </div>

        {menuOpen && isAuthenticated && (
          <div className="md:hidden border-t border-border bg-surface px-4 sm:px-5 py-3 flex flex-col gap-0.5 max-h-[calc(100vh-56px)] overflow-y-auto">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-[14px] ${isActive ? 'bg-surface2 text-ink font-semibold' : 'text-inkSecondary'}`
              }
            >
              Início
            </NavLink>
            {isMember &&
              memberGroups.map((g) => (
                <div key={g.label} className="mt-2.5 pt-2.5 border-t border-border first:mt-0 first:pt-0 first:border-t-0">
                  <span className="block mb-1 pl-2.5 border-l-2 border-accent text-[12px] uppercase tracking-wider text-ink font-extrabold">
                    {g.label}
                  </span>
                  {g.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `block px-3 py-2.5 rounded-lg text-[14px] ${isActive ? 'bg-surface2 text-ink font-semibold' : 'text-inkSecondary'}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ))}
            {podeVerAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `mt-2 px-3 py-2.5 rounded-lg text-[14px] ${isActive ? 'bg-surface2 text-ink font-semibold' : 'text-inkSecondary'}`
                }
              >
                Administração
              </NavLink>
            )}
            <div className="mt-2 pt-3 border-t border-border flex items-center justify-between gap-2.5">
              {isAuthenticated ? (
                <>
                  <span className="text-[12.5px] text-muted truncate">Olá, {nomeExibido}</span>
                  <Button variant="secondary" size="sm" onClick={handleSignOut}>
                    Sair
                  </Button>
                </>
              ) : (
                <NavLink to="/entrar" className="w-full">
                  <Button variant="info" size="sm" className="w-full justify-center">
                    Entrar
                  </Button>
                </NavLink>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-[1180px] mx-auto px-4 sm:px-5 pt-6 sm:pt-7 pb-16 w-full">
        <Suspense fallback={<p className="text-sm text-muted text-center py-16">Carregando...</p>}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="mt-10 py-10 px-4 text-center">
        <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
          © {new Date().getFullYear()} Assembleia de Deus de Nova Almeida — Fé, Família e Esperança
        </p>
        <NavLink
          to="/privacidade"
          className="inline-block mt-2 text-[11px] tracking-[0.14em] uppercase text-muted hover:text-inkSecondary underline underline-offset-2"
        >
          Privacidade e Proteção de Dados
        </NavLink>
      </footer>
    </div>
  );
}
