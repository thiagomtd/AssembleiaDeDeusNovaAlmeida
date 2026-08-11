import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Pill, fmtBRL } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash } from '../../components/icons';

interface Campanha {
  campanhaId: string;
  titulo: string;
  descricao: string;
  meta: number;
  arrecadado: number;
  dataFim: string;
  ativa: boolean;
}

export function Campanhas() {
  const navigate = useNavigate();
  const [lista, setLista] = useState<Campanha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [alvoRemover, setAlvoRemover] = useState<Campanha | null>(null);

  const carregar = () => {
    setCarregando(true);
    api
      .get<Campanha[]>('/campanhas')
      .then(setLista)
      .catch(() => setLista([]))
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const remover = async (motivo: string) => {
    if (!alvoRemover) return;
    await api.del(`/campanhas/${alvoRemover.campanhaId}`, { motivo });
    setAlvoRemover(null);
    carregar();
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex justify-between items-center gap-2.5 flex-wrap px-4.5 py-3.5 border-b border-border">
        <span className="text-[12.5px] text-muted">{lista.length} campanhas cadastradas</span>
        <Link to="/admin/campanhas/nova">
          <span className="inline-flex items-center gap-1.5 bg-accent text-[#241703] text-[12.5px] font-semibold rounded-lg px-3 py-1.5">
            <IconPlus className="icon w-3.5 h-3.5" /> Nova campanha
          </span>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr>
              {['Título', 'Meta', 'Arrecadado', 'Status', ''].map((h) => (
                <th key={h} className="text-left text-[10.5px] uppercase tracking-wider text-muted font-bold px-3 py-2.5 border-b border-border whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.campanhaId}>
                <td className="px-3 py-2.5 border-b border-border text-ink">{c.titulo}</td>
                <td className="px-3 py-2.5 border-b border-border text-inkSecondary">{fmtBRL(c.meta)}</td>
                <td className="px-3 py-2.5 border-b border-border font-semibold text-income">{fmtBRL(c.arrecadado)}</td>
                <td className="px-3 py-2.5 border-b border-border">
                  <Pill tone={c.ativa ? 'active' : 'inactive'}>{c.ativa ? 'Ativa' : 'Encerrada'}</Pill>
                </td>
                <td className="px-3 py-2.5 border-b border-border whitespace-nowrap">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => navigate(`/admin/campanhas/${c.campanhaId}/editar`, { state: { campanha: c } })}
                      className="w-[30px] h-[30px] rounded-lg border border-border inline-flex items-center justify-center text-inkSecondary hover:bg-surface2"
                      title="Editar"
                    >
                      <IconEdit className="icon w-[13px] h-[13px]" />
                    </button>
                    <button
                      onClick={() => setAlvoRemover(c)}
                      className="w-[30px] h-[30px] rounded-lg border border-border inline-flex items-center justify-center text-inkSecondary hover:bg-expense hover:text-white hover:border-expense"
                      title="Excluir"
                    >
                      <IconTrash className="icon w-[13px] h-[13px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!carregando && lista.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  Nenhuma campanha cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        aberto={!!alvoRemover}
        titulo="Remover campanha"
        mensagem={
          alvoRemover
            ? `Remover a campanha "${alvoRemover.titulo}"? Os lançamentos já vinculados a ela permanecem no histórico.`
            : ''
        }
        onCancelar={() => setAlvoRemover(null)}
        onConfirmar={remover}
      />
    </Card>
  );
}
