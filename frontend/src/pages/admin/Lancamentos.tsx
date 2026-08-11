import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Pill, fmtBRL } from '../../components/ui';
import { IconPlus, IconEdit, IconUsers } from '../../components/icons';
import { MonthPicker } from '../../components/MonthPicker';

interface Lancamento {
  transactionId: string;
  mesAno: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  categoria: string;
  data: string;
  membroNome?: string;
}

export function Lancamentos() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [itens, setItens] = useState<Lancamento[]>([]);
  const mesAno = `${ano}-${String(mes).padStart(2, '0')}`;

  useEffect(() => {
    api.get<Lancamento[]>(`/admin/transactions?mes=${mesAno}`).then(setItens).catch(() => setItens([]));
  }, [mesAno]);

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
              {['Data', 'Tipo', 'Categoria', 'Dizimista', 'Valor'].map((h) => (
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
                  {t.membroNome ? (
                    <span className="inline-flex items-center gap-1.5">
                      <IconUsers className="icon w-3 h-3 text-muted" /> {t.membroNome}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className={`px-3 py-2.5 border-b border-border text-right font-semibold ${t.tipo === 'entrada' ? 'text-income' : 'text-expense'}`}>
                  {t.tipo === 'entrada' ? '+' : '-'} {fmtBRL(t.valor)}
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  Nenhum lançamento neste mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
