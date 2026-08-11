import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Pill } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash, IconShield, IconUsers, IconImage, IconCheck, IconLock } from '../../components/icons';

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
          <span className="text-[12.5px] text-muted">
            {membros.length} membros cadastrados · cada membro é também um usuário do sistema
          </span>
          <Link to="/admin/membros/novo">
            <span className="inline-flex items-center gap-1.5 bg-accent text-[#241703] text-[12.5px] font-semibold rounded-lg px-3 py-1.5">
              <IconPlus className="icon w-3.5 h-3.5" /> Novo membro
            </span>
          </Link>
        </div>
        <div className="overflow-x-auto">
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
              {membros.map((m) => {
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
                        className="w-[30px] h-[30px] rounded-lg border border-border inline-flex items-center justify-center text-inkSecondary hover:bg-surface2"
                        title="Editar"
                      >
                        <IconEdit className="icon w-[13px] h-[13px]" />
                      </button>
                      <button
                        onClick={() => setAlvoRemover(m)}
                        className="w-[30px] h-[30px] rounded-lg border border-border inline-flex items-center justify-center text-inkSecondary hover:bg-expense hover:text-white hover:border-expense"
                        title="Excluir"
                      >
                        <IconTrash className="icon w-[13px] h-[13px]" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {!carregando && membros.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">
                    Nenhum membro cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[12px] text-muted leading-relaxed mt-3">
        O grupo de acesso define o que a pessoa enxerga no sistema: <strong className="text-ink">Membro</strong> tem
        leitura de finanças, dizimistas, mídia e relatórios; <strong className="text-ink">Mídia</strong> soma a
        gestão de cultos e fotos/vídeos; <strong className="text-ink">Tesouraria</strong> soma a gestão de
        lançamentos financeiros; <strong className="text-ink">Administração</strong> (diretoria) tem acesso total.
      </p>

      <ConfirmDialog
        aberto={!!alvoRemover}
        titulo="Remover membro"
        mensagem={alvoRemover ? `Remover o acesso de ${alvoRemover.nome}? A conta também é removida do Cognito.` : ''}
        onCancelar={() => setAlvoRemover(null)}
        onConfirmar={remover}
      />
    </div>
  );
}
