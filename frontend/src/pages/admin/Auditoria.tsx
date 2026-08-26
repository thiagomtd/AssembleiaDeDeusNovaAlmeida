import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { Card, Pill, Pagination, SearchInput, combina } from '../../components/ui';
import { MonthPicker } from '../../components/MonthPicker';
import { AttachmentViewer } from '../../components/AttachmentViewer';
import { IconPaperclip } from '../../components/icons';

const POR_PAGINA = 20;

interface Entrada {
  timestampId: string;
  timestamp: string;
  acao: string;
  entidadeId: string;
  detalhes: string;
  motivo: string;
  atorNome: string;
  anexoUrl: string | null;
}

const ACAO_LABEL: Record<string, string> = {
  'membro.criar': 'Membro criado',
  'membro.editar': 'Membro editado',
  'membro.remover': 'Membro removido',
  'lancamento.criar': 'Lançamento criado',
  'lancamento.editar': 'Lançamento editado',
  'lancamento.remover': 'Lançamento removido',
  'campanha.criar': 'Meta criada',
  'campanha.editar': 'Meta editada',
  'campanha.remover': 'Meta removida',
  'culto.criar': 'Culto criado',
  'culto.remover': 'Culto removido',
  'midia.criar': 'Mídia enviada',
  'midia.remover': 'Mídia removida',
  'info.editar': 'Informações institucionais editadas',
  login: 'Login realizado',
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
  const [anexoAberto, setAnexoAberto] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const mesAno = `${ano}-${String(mes).padStart(2, '0')}`;

  useEffect(() => {
    setCarregando(true);
    api
      .get<Entrada[]>(`/auditoria?mes=${mesAno}`)
      .then(setItens)
      .catch(() => setItens([]))
      .finally(() => setCarregando(false));
  }, [mesAno]);
  useEffect(() => setPagina(1), [busca, mesAno]);

  const filtrados = useMemo(
    () => itens.filter((e) => combina(busca, ACAO_LABEL[e.acao] ?? e.acao, e.atorNome, e.detalhes, e.motivo)),
    [itens, busca],
  );
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  return (
    <div>
      <Card className="overflow-hidden">
        <div className="flex justify-between items-center gap-2.5 flex-wrap px-4.5 py-3.5 border-b border-border">
          <MonthPicker mes={mes} ano={ano} onChange={(m, a) => { setMes(m); setAno(a); }} />
          <div className="flex items-center gap-2.5 flex-wrap">
            <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por ação, pessoa, detalhes..." />
            <span className="text-[12.5px] text-muted whitespace-nowrap">{filtrados.length} de {itens.length} ações</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr>
                {['Data/hora', 'Ação', 'Quem fez', 'Detalhes', 'Motivo', 'Anexo'].map((h) => (
                  <th key={h} className="text-left text-[10.5px] uppercase tracking-wider text-muted font-bold px-3 py-2.5 border-b border-border whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiveis.map((e) => (
                <tr key={e.timestampId}>
                  <td className="px-3 py-2.5 border-b border-border text-inkSecondary whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-3 py-2.5 border-b border-border">
                    <Pill tone={acaoTone(e.acao)}>{ACAO_LABEL[e.acao] ?? e.acao}</Pill>
                  </td>
                  <td className="px-3 py-2.5 border-b border-border text-ink">{e.atorNome}</td>
                  <td className="px-3 py-2.5 border-b border-border text-inkSecondary">{e.detalhes}</td>
                  <td className="px-3 py-2.5 border-b border-border text-inkSecondary max-w-[240px]">{e.motivo || '—'}</td>
                  <td className="px-3 py-2.5 border-b border-border">
                    {e.anexoUrl ? (
                      <button
                        type="button"
                        onClick={() => setAnexoAberto(e.anexoUrl!)}
                        className="inline-flex items-center gap-1 text-accentStrong hover:underline text-[12.5px]"
                      >
                        <IconPaperclip className="icon w-3.5 h-3.5" /> Ver
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!carregando && filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">
                    {itens.length === 0 ? 'Nenhuma ação registrada neste mês.' : 'Nenhuma ação encontrada para essa busca.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onChange={setPagina} />
      </Card>

      {anexoAberto && <AttachmentViewer url={anexoAberto} onClose={() => setAnexoAberto(null)} />}
    </div>
  );
}
