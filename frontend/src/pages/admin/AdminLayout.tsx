import { NavLink, Outlet } from 'react-router-dom';
import { Eyebrow } from '../../components/ui';
import { useAuth, type Grupo } from '../../context/AuthContext';
import { IconLock, IconUsers, IconPlus, IconShield, IconImage, IconInfo } from '../../components/icons';

const tabs = [
  { to: '/admin/membros', label: 'Membros', icon: IconUsers, end: true, roles: ['admin'] as Grupo[] },
  { to: '/admin/membros/novo', label: 'Novo membro', icon: IconPlus, end: true, roles: ['admin'] as Grupo[] },
  { to: '/admin/lancamentos', label: 'Lançamentos', icon: IconShield, end: true, roles: ['admin', 'tesouraria'] as Grupo[] },
  { to: '/admin/lancamentos/novo', label: 'Novo lançamento', icon: IconPlus, end: true, roles: ['admin', 'tesouraria'] as Grupo[] },
  { to: '/admin/cultos', label: 'Cultos', icon: IconImage, end: true, roles: ['admin', 'midia'] as Grupo[] },
  { to: '/admin/info', label: 'Informações', icon: IconInfo, end: true, roles: ['admin'] as Grupo[] },
];

export function AdminLayout() {
  const { grupos } = useAuth();
  const visiveis = tabs.filter((t) => grupos.some((g) => t.roles.includes(g)));

  return (
    <section>
      <Eyebrow icon={<IconLock className="icon w-3 h-3" />}>Restrito</Eyebrow>
      <h1 className="text-[27px] mb-1.5 text-ink">Administração</h1>
      <p className="text-inkSecondary text-[14.5px] max-w-[62ch] mb-6">
        Cadastro de membros, lançamentos financeiros, cultos e mídia, e informações institucionais.
      </p>

      <div className="flex gap-5 border-b border-border mb-5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visiveis.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex-none flex items-center gap-1.5 pb-2.5 text-[13.5px] font-semibold border-b-2 ${
                isActive ? 'text-ink border-accent' : 'text-muted border-transparent hover:text-ink'
              }`
            }
          >
            <t.icon className="icon w-3.5 h-3.5" />
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </section>
  );
}
