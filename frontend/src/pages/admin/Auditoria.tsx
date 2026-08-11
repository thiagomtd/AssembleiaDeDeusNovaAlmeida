import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Card, Pill } from '../../components/ui';
import { MonthPicker } from '../../components/MonthPicker';

interface Entrada {
  timestampId: string;
  timestamp: string;
  acao: string;
  entidadeId: string;
  detalhes: string;
  atorNome: string;
}

const ACAO_LABEL: Record<string, string> = {
  'membro.criar': 'Membro criado',
  'membro.editar': 'Membro editado',
  'membro.remover': 'Membro removido',
  'lancamento.criar': 'Lançamento criado',
  'lancamento.editar': 'Lançamento editado',
  'lancamento.remover': 'Lançamento removido',
  'campanha.criar': 'Campanha criada',
  'campanha.editar': 'Campanha editada',
  'campanha.remover': 'Campanha removida',
  'info.editar': 'Informações institucionais editadas',
};

function acaoTone(acao: string): 'expense' | 'income' | 'inactive' {
  if (acao.endsWith('.remover')) return 'expense';
  if (acao.endsWith('.criar')) return 'income';
  return 'inactive';
}

export function Auditoria() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [itens, setItens] = useState<Entrada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const mesAno = `${ano}-${String(mes).padStart(2, '0')}`;

  useEffect(() => {
    setCarregando(true);
    api
      .get<Entrada[]>(`/auditoria?mes=${mesAno}`)
      .then(setItens)
      .catch(() => setItens([]))
      .finally(() => setCarregando(false));
  }, [mesAno]);

  return (
    <div>
      <Card className="overflow-hidden">
        <div className="flex justify-between items-center gap-2.5 flex-wrap px-4.5 py-3.5 border-b border-border">
          <MonthPicker mes={mes} ano={ano} onChange={(m, a) => { setMes(m); setAno(a); }} />
          <span className="text-[12.5px] text-muted">{itens.length} ações neste mês</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr>
                {['Data/hora', 'Ação', 'Quem fez', 'Detalhes'].map((h) => (
                  <th key={h} className="text-left text-[10.5px] uppercase tracking-wider text-muted font-bold px-3 py-2.5 border-b border-border whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((e) => (
                <tr key={e.timestampId}>
                  <td className="px-3 py-2.5 border-b border-border text-inkSecondary whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-3 py-2.5 border-b border-border">
                    <Pill tone={acaoTone(e.acao)}>{ACAO_LABEL[e.acao] ?? e.acao}</Pill>
                  </td>
                  <td className="px-3 py-2.5 border-b border-border text-ink">{e.atorNome}</td>
                  <td className="px-3 py-2.5 border-b border-border text-inkSecondary">{e.detalhes}</td>
                </tr>
              ))}
              {!carregando && itens.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted">
                    Nenhuma ação registrada neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[12px] text-muted leading-relaxed mt-3">
        Registro das ações administrativas (criação, edição e remoção de membros, lançamentos, campanhas e
        informações institucionais), mantido para conformidade com a LGPD.
      </p>
    </div>
  );
}
