import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Pill, Pagination, SearchInput, FilterSelect, combina } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash, IconShield, IconUsers, IconImage, IconCheck, IconLock } from '../../components/icons';

const POR_PAGINA = 10;

interface Membro {
  memberId: string;
  nome: string;
  telefone: string;
  dataNascimento: string;
  dataAssociacao: string;
  grupo: 'admin' | 'member' | 'midia' | 'tesouraria';
  status: 'ativo' | 'inativo';
}

const GRUPO_INFO: Record<Membro['grupo'], { label: string; tone: 'role-admin' | 'role-member' | 'role-midia' | 'role-tesouraria'; Icon: typeof IconShield }> = {
  admin: { label: 'Administração', tone: 'role-admin', Icon: IconShield },
  tesouraria: { label: 'Tesouraria', tone: 'role-tesouraria', Icon: IconShield },
  midia: { label: 'Mídia', tone: 'role-midia', Icon: IconImage },
  member: { label: 'Membro', tone: 'role-member', Icon: IconUsers },
};

export function Membros() {
  const navigate = useNavigate();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [alvoRemover, setAlvoRemover] = useState<Membro | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(
    () =>
      membros
        .filter((m) => !filtroGrupo || m.grupo === filtroGrupo)
        .filter((m) => !filtroStatus || m.status === filtroStatus)
        .filter((m) => combina(busca, m.nome, m.telefone)),
    [membros, busca, filtroGrupo, filtroStatus],
  );
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  useEffect(() => setPagina(1), [busca, filtroGrupo, filtroStatus]);

  const carregar = () => {
    setCarregando(true);
    api
      .get<Membro[]>('/members')
      .then(setMembros)
      .catch(() => setMembros([]))
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const remover = async (motivo: string, anexoKey?: string) => {
    if (!alvoRemover) return;
    await api.del(`/members/${alvoRemover.memberId}`, { motivo, anexoKey });
    setAlvoRemover(null);
    carregar();
  };

  return (
    <div>
      <Card className="overflow-hidden">
        <div className="flex justify-between items-center gap-2.5 flex-wrap px-4.5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[12.5px] text-muted whitespace-nowrap">
              {filtrados.length} de {membros.length} membros
            </span>
            <FilterSelect
              value={filtroGrupo}
              onChange={setFiltroGrupo}
              options={Object.entries(GRUPO_INFO).map(([value, info]) => ({ value, label: info.label }))}
              allLabel="Todos os grupos"
            />
            <FilterSelect
              value={filtroStatus}
              onChange={setFiltroStatus}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
              ]}
              allLabel="Todos os status"
            />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome ou celular..." />
            <Link to="/admin/membros/novo">
              <span className="inline-flex items-center gap-1.5 bg-success text-white text-[12.5px] font-semibold rounded-lg px-3 py-1.5 hover:opacity-90">
                <IconPlus className="icon w-3.5 h-3.5" /> Novo membro
              </span>
            </Link>
          </div>
        </div>
        <div className="sm:hidden flex flex-col gap-2.5 p-3.5">
          {visiveis.map((m) => {
            const info = GRUPO_INFO[m.grupo];
            const GrupoIcon = info.Icon;
            return (
              <div key={m.memberId} className="rounded-xl bg-surface2 border border-border p-3.5 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2.5">
                  <span className="text-[14px] font-semibold text-ink">{m.nome}</span>
                  <Pill tone={m.status === 'ativo' ? 'active' : 'inactive'}>
                    {m.status === 'ativo' ? <IconCheck className="icon w-2.5 h-2.5" /> : <IconLock className="icon w-2.5 h-2.5" />}
                    {m.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Pill>
                </div>
                <span className="text-[13px] text-inkSecondary">{m.telefone}</span>
                <div className="flex items-center justify-between gap-2.5 flex-wrap">
                  <Pill tone={info.tone}>
                    <GrupoIcon className="icon w-2.5 h-2.5" />
                    {info.label}
                  </Pill>
                  <span className="text-[12px] text-muted">Desde {m.dataAssociacao}</span>
                </div>
                <div className="flex gap-1.5 justify-end pt-1">
                  <button
                    onClick={() => navigate(`/admin/membros/${m.memberId}/editar`, { state: { membro: m } })}
                    className="w-[30px] h-[30px] rounded-lg border border-info/30 bg-infoSoft inline-flex items-center justify-center text-info hover:bg-info hover:text-white hover:border-info"
                    title="Editar"
                  >
                    <IconEdit className="icon w-[13px] h-[13px]" />
                  </button>
                  <button
                    onClick={() => setAlvoRemover(m)}
                    className="w-[30px] h-[30px] rounded-lg border border-danger/30 bg-dangerSoft inline-flex items-center justify-center text-danger hover:bg-danger hover:text-white hover:border-danger"
                    title="Excluir"
                  >
                    <IconTrash className="icon w-[13px] h-[13px]" />
                  </button>
                </div>
              </div>
            );
          })}
          {!carregando && filtrados.length === 0 && (
            <p className="px-3 py-8 text-center text-muted">
              {membros.length === 0 ? 'Nenhum membro cadastrado.' : 'Nenhum membro encontrado para essa busca.'}
            </p>
          )}
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr>
                {['Nome', 'Celular (login)', 'Associação', 'Grupo de acesso', 'Status', ''].map((h) => (
                  <th key={h} className="text-left text-[10.5px] uppercase tracking-wider text-muted font-bold px-3 py-2.5 border-b border-border whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiveis.map((m) => {
                const info = GRUPO_INFO[m.grupo];
                const GrupoIcon = info.Icon;
                return (
                <tr key={m.memberId}>
                  <td className="px-3 py-2.5 border-b border-border text-ink">{m.nome}</td>
                  <td className="px-3 py-2.5 border-b border-border text-inkSecondary">{m.telefone}</td>
                  <td className="px-3 py-2.5 border-b border-border text-inkSecondary">{m.dataAssociacao}</td>
                  <td className="px-3 py-2.5 border-b border-border">
                    <Pill tone={info.tone}>
                      <GrupoIcon className="icon w-2.5 h-2.5" />
                      {info.label}
                    </Pill>
                  </td>
                  <td className="px-3 py-2.5 border-b border-border">
                    <Pill tone={m.status === 'ativo' ? 'active' : 'inactive'}>
                      {m.status === 'ativo' ? <IconCheck className="icon w-2.5 h-2.5" /> : <IconLock className="icon w-2.5 h-2.5" />}
                      {m.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Pill>
                  </td>
                  <td className="px-3 py-2.5 border-b border-border whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/membros/${m.memberId}/editar`, { state: { membro: m } })}
                        className="w-[30px] h-[30px] rounded-lg border border-info/30 bg-infoSoft inline-flex items-center justify-center text-info hover:bg-info hover:text-white hover:border-info"
                        title="Editar"
                      >
                        <IconEdit className="icon w-[13px] h-[13px]" />
                      </button>
                      <button
                        onClick={() => setAlvoRemover(m)}
                        className="w-[30px] h-[30px] rounded-lg border border-danger/30 bg-dangerSoft inline-flex items-center justify-center text-danger hover:bg-danger hover:text-white hover:border-danger"
                        title="Excluir"
                      >
                        <IconTrash className="icon w-[13px] h-[13px]" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {!carregando && filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">
                    {membros.length === 0 ? 'Nenhum membro cadastrado.' : 'Nenhum membro encontrado para essa busca.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onChange={setPagina} />
      </Card>

      <ConfirmDialog
        aberto={!!alvoRemover}
        titulo="Remover membro"
        mensagem={alvoRemover ? `Remover o acesso de ${alvoRemover.nome}? A conta também é removida do Cognito.` : ''}
        perigo
        onCancelar={() => setAlvoRemover(null)}
        onConfirmar={remover}
      />
    </div>
  );
}
