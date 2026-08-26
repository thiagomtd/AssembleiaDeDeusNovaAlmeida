import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Pill, fmtBRL, Pagination, SearchInput, combina } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash } from '../../components/icons';

const POR_PAGINA = 10;

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
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(
    () => lista.filter((c) => combina(busca, c.titulo, c.descricao)),
    [lista, busca],
  );
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  useEffect(() => setPagina(1), [busca]);

  const carregar = () => {
    setCarregando(true);
    api
      .get<Campanha[]>('/campanhas')
      .then(setLista)
      .catch(() => setLista([]))
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const remover = async (motivo: string, anexoKey?: string) => {
    if (!alvoRemover) return;
    await api.del(`/campanhas/${alvoRemover.campanhaId}`, { motivo, anexoKey });
    setAlvoRemover(null);
    carregar();
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex justify-between items-center gap-2.5 flex-wrap px-4.5 py-3.5 border-b border-border">
        <span className="text-[12.5px] text-muted">{filtrados.length} de {lista.length} metas cadastradas</span>
        <div className="flex items-center gap-2.5 flex-wrap">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por título..." />
          <Link to="/admin/campanhas/nova">
            <span className="inline-flex items-center gap-1.5 bg-success text-white text-[12.5px] font-semibold rounded-lg px-3 py-1.5 hover:opacity-90">
              <IconPlus className="icon w-3.5 h-3.5" /> Nova meta
            </span>
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr>
              {['Título', 'Meta', 'Arrecadado', 'Status', ''].map((h) => (
                <th
                  key={h}
                  className={`text-[10.5px] uppercase tracking-wider text-muted font-bold px-3 py-2.5 border-b border-border whitespace-nowrap ${
                    h === 'Meta' || h === 'Arrecadado' ? 'text-right' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((c) => (
              <tr key={c.campanhaId}>
                <td className="px-3 py-2.5 border-b border-border text-ink">{c.titulo}</td>
                <td className="px-3 py-2.5 border-b border-border text-right text-inkSecondary">{fmtBRL(c.meta)}</td>
                <td className="px-3 py-2.5 border-b border-border text-right font-semibold text-income">{fmtBRL(c.arrecadado)}</td>
                <td className="px-3 py-2.5 border-b border-border">
                  <Pill tone={c.ativa ? 'active' : 'inactive'}>{c.ativa ? 'Ativa' : 'Encerrada'}</Pill>
                </td>
                <td className="px-3 py-2.5 border-b border-border whitespace-nowrap">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => navigate(`/admin/campanhas/${c.campanhaId}/editar`, { state: { campanha: c } })}
                      className="w-[30px] h-[30px] rounded-lg border border-info/30 bg-infoSoft inline-flex items-center justify-center text-info hover:bg-info hover:text-white hover:border-info"
                      title="Editar"
                    >
                      <IconEdit className="icon w-[13px] h-[13px]" />
                    </button>
                    <button
                      onClick={() => setAlvoRemover(c)}
                      className="w-[30px] h-[30px] rounded-lg border border-danger/30 bg-dangerSoft inline-flex items-center justify-center text-danger hover:bg-danger hover:text-white hover:border-danger"
                      title="Excluir"
                    >
                      <IconTrash className="icon w-[13px] h-[13px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!carregando && filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  {lista.length === 0 ? 'Nenhuma meta cadastrada.' : 'Nenhuma meta encontrada para essa busca.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onChange={setPagina} />

      <ConfirmDialog
        aberto={!!alvoRemover}
        titulo="Remover meta"
        mensagem={
          alvoRemover
            ? `Remover a meta "${alvoRemover.titulo}"? Os lançamentos já vinculados a ela permanecem no histórico.`
            : ''
        }
        perigo
        onCancelar={() => setAlvoRemover(null)}
        onConfirmar={remover}
      />
    </Card>
  );
}
