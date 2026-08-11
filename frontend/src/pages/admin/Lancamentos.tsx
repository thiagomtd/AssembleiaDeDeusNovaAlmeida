import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Pill, fmtBRL } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash, IconUsers, IconTarget } from '../../components/icons';
import { MonthPicker } from '../../components/MonthPicker';

interface Lancamento {
  transactionId: string;
  mesAno: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  categoria: string;
  data: string;
  membroId?: string;
  membroNome?: string;
  campanhaId?: string;
  campanhaTitulo?: string;
  descricao?: string;
}

export function Lancamentos() {
  const navigate = useNavigate();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [itens, setItens] = useState<Lancamento[]>([]);
  const [alvoRemover, setAlvoRemover] = useState<Lancamento | null>(null);
  const mesAno = `${ano}-${String(mes).padStart(2, '0')}`;

  const carregar = () => {
    api.get<Lancamento[]>(`/admin/transactions?mes=${mesAno}`).then(setItens).catch(() => setItens([]));
  };

  useEffect(carregar, [mesAno]);

  const remover = async (motivo: string, anexoKey?: string) => {
    if (!alvoRemover) return;
    await api.del(`/transactions/${alvoRemover.mesAno}/${alvoRemover.transactionId}`, { motivo, anexoKey });
    setAlvoRemover(null);
    carregar();
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex justify-between items-center gap-2.5 flex-wrap px-4.5 py-3.5 border-b border-border">
        <MonthPicker mes={mes} ano={ano} onChange={(m, a) => { setMes(m); setAno(a); }} />
        <Link to="/admin/lancamentos/novo">
          <span className="inline-flex items-center gap-1.5 bg-accent text-[#241703] text-[12.5px] font-semibold rounded-lg px-3 py-1.5">
            <IconPlus className="icon w-3.5 h-3.5" /> Novo lançamento
          </span>
        </Link>
      </div>
      <p className="px-4.5 pt-3 text-[12px] text-muted">Visão completa (com o vínculo do dizimista) — só a administração vê esta tela.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr>
              {['Data', 'Tipo', 'Categoria', 'Dizimista / Campanha', 'Valor', ''].map((h) => (
                <th key={h} className="text-left text-[10.5px] uppercase tracking-wider text-muted font-bold px-3 py-2.5 border-b border-border whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itens.map((t) => (
              <tr key={t.transactionId}>
                <td className="px-3 py-2.5 border-b border-border text-inkSecondary">{t.data.split('-').reverse().join('/')}</td>
                <td className="px-3 py-2.5 border-b border-border">
                  <Pill tone={t.tipo === 'entrada' ? 'income' : 'expense'}>{t.tipo === 'entrada' ? 'Entrada' : 'Saída'}</Pill>
                </td>
                <td className="px-3 py-2.5 border-b border-border text-inkSecondary">{t.categoria}</td>
                <td className="px-3 py-2.5 border-b border-border text-inkSecondary">
                  <div className="flex flex-col gap-1">
                    {t.membroNome && (
                      <span className="inline-flex items-center gap-1.5">
                        <IconUsers className="icon w-3 h-3 text-muted" /> {t.membroNome}
                      </span>
                    )}
                    {t.campanhaTitulo && (
                      <span className="inline-flex items-center gap-1.5">
                        <IconTarget className="icon w-3 h-3 text-muted" /> {t.campanhaTitulo}
                      </span>
                    )}
                    {!t.membroNome && !t.campanhaTitulo && <span className="text-muted">—</span>}
                  </div>
                </td>
                <td className={`px-3 py-2.5 border-b border-border text-right font-semibold ${t.tipo === 'entrada' ? 'text-income' : 'text-expense'}`}>
                  {t.tipo === 'entrada' ? '+' : '-'} {fmtBRL(t.valor)}
                </td>
                <td className="px-3 py-2.5 border-b border-border whitespace-nowrap">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => navigate(`/admin/lancamentos/${t.mesAno}/${t.transactionId}/editar`, { state: { lancamento: t } })}
                      className="w-[30px] h-[30px] rounded-lg border border-border inline-flex items-center justify-center text-inkSecondary hover:bg-surface2"
                      title="Editar"
                    >
                      <IconEdit className="icon w-[13px] h-[13px]" />
                    </button>
                    <button
                      onClick={() => setAlvoRemover(t)}
                      className="w-[30px] h-[30px] rounded-lg border border-border inline-flex items-center justify-center text-inkSecondary hover:bg-expense hover:text-white hover:border-expense"
                      title="Excluir"
                    >
                      <IconTrash className="icon w-[13px] h-[13px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted">
                  Nenhum lançamento neste mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        aberto={!!alvoRemover}
        titulo="Remover lançamento"
        mensagem={
          alvoRemover
            ? `Remover este lançamento de ${fmtBRL(alvoRemover.valor)} (${alvoRemover.categoria})? Essa ação não pode ser desfeita.`
            : ''
        }
        onCancelar={() => setAlvoRemover(null)}
        onConfirmar={remover}
      />
    </Card>
  );
}
