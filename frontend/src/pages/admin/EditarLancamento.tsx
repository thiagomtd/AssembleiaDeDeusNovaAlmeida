import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Button, Field, inputCls, ComboBox } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { AttachmentViewer } from '../../components/AttachmentViewer';
import { IconChevronLeft, IconPaperclip } from '../../components/icons';

const CATEGORIAS = ['Dízimo', 'Oferta', 'Doação', 'Contas', 'Manutenção', 'Eventos', 'Outros'];

function extensaoDe(file: File) {
  const partes = file.name.split('.');
  return partes.length > 1 ? partes.pop()! : 'bin';
}

async function enviarComprovante(file: File): Promise<string> {
  const { comprovanteKey, uploadUrl } = await api.post<{ comprovanteKey: string; uploadUrl: string }>(
    '/transactions/comprovante/presign',
    { contentType: file.type || 'application/octet-stream', extensao: extensaoDe(file) },
  );
  await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
  return comprovanteKey;
}

interface Membro {
  memberId: string;
  nome: string;
}
interface Campanha {
  campanhaId: string;
  titulo: string;
  ativa: boolean;
}
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
  comprovanteKey?: string;
  comprovanteUrl?: string | null;
}

export function EditarLancamento() {
  const { mes, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const lancamentoDoState = (location.state as { lancamento?: Lancamento } | null)?.lancamento;

  const [membros, setMembros] = useState<Membro[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [lancamento, setLancamento] = useState<Lancamento | null>(lancamentoDoState ?? null);
  const [carregando, setCarregando] = useState(!lancamentoDoState);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [comprovanteAberto, setComprovanteAberto] = useState<string | null>(null);

  useEffect(() => {
    api.get<Membro[]>('/members').then(setMembros).catch(() => setMembros([]));
    api.get<Campanha[]>('/campanhas').then((r) => setCampanhas(r.filter((c) => c.ativa))).catch(() => setCampanhas([]));
  }, []);

  useEffect(() => {
    if (lancamentoDoState || !mes) return;
    api
      .get<Lancamento[]>(`/admin/transactions?mes=${mes}`)
      .then((lista) => setLancamento(lista.find((t) => t.transactionId === id) ?? null))
      .finally(() => setCarregando(false));
  }, [mes, id, lancamentoDoState]);

  const mostrarDizimista = lancamento?.tipo === 'entrada' && lancamento?.categoria === 'Dízimo';
  const mostrarCampanha = lancamento?.tipo === 'entrada' && campanhas.length > 0;

  const validarEAbrirConfirmacao = (e: FormEvent) => {
    e.preventDefault();
    if (!lancamento) return;
    setErro('');
    if (!lancamento.valor || lancamento.valor <= 0) {
      setErro('Informe um valor válido.');
      return;
    }
    if (!lancamento.data) {
      setErro('Informe a data do lançamento.');
      return;
    }
    if (lancamento.tipo === 'saida' && !comprovante && !lancamento.comprovanteKey) {
      setErro('Anexe um comprovante para registrar uma saída.');
      return;
    }
    setConfirmando(true);
  };

  const salvar = async (motivo: string, anexoKey?: string) => {
    if (!lancamento) return;
    try {
      const membro = membros.find((m) => m.memberId === lancamento.membroId);
      const campanha = campanhas.find((c) => c.campanhaId === lancamento.campanhaId);
      const comprovanteKey =
        lancamento.tipo === 'saida'
          ? comprovante
            ? await enviarComprovante(comprovante)
            : lancamento.comprovanteKey
          : undefined;
      await api.put(`/transactions/${lancamento.mesAno}/${lancamento.transactionId}`, {
        tipo: lancamento.tipo,
        categoria: lancamento.categoria,
        valor: Number(lancamento.valor),
        data: lancamento.data,
        descricao: lancamento.descricao ?? '',
        membroId: mostrarDizimista && lancamento.membroId ? lancamento.membroId : undefined,
        membroNome: mostrarDizimista && membro ? membro.nome : undefined,
        campanhaId: mostrarCampanha && lancamento.campanhaId ? lancamento.campanhaId : undefined,
        campanhaTitulo: mostrarCampanha && campanha ? campanha.titulo : undefined,
        comprovanteKey,
        motivo,
        anexoKey,
      });
      navigate('/admin/lancamentos');
    } catch (err: any) {
      setConfirmando(false);
      setErro(err?.message || 'Não foi possível salvar as alterações.');
    }
  };

  if (carregando) return <p className="text-sm text-muted text-center py-10">Carregando...</p>;
  if (!lancamento) return <p className="text-sm text-muted text-center py-10">Lançamento não encontrado.</p>;

  return (
    <div>
      <button
        onClick={() => navigate('/admin/lancamentos')}
        className="inline-flex items-center gap-1 text-[12.5px] text-inkSecondary mb-4"
      >
        <IconChevronLeft className="icon w-[13px] h-[13px]" /> Voltar para Lançamentos
      </button>

      <Card>
        <form onSubmit={validarEAbrirConfirmacao}>
          <div className="grid sm:grid-cols-2 gap-3.5 p-4.5">
            <Field label="Tipo">
              <select
                className={inputCls}
                value={lancamento.tipo}
                onChange={(e) => setLancamento({ ...lancamento, tipo: e.target.value as Lancamento['tipo'] })}
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </Field>
            <Field label="Categoria">
              <select
                className={inputCls}
                value={lancamento.categoria}
                onChange={(e) => setLancamento({ ...lancamento, categoria: e.target.value })}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Valor (R$)">
              <input
                required
                className={inputCls}
                value={lancamento.valor}
                onChange={(e) => setLancamento({ ...lancamento, valor: Number(e.target.value.replace(',', '.')) || 0 })}
              />
            </Field>
            <Field label="Data">
              <input
                required
                type="date"
                className={inputCls}
                value={lancamento.data}
                onChange={(e) => setLancamento({ ...lancamento, data: e.target.value })}
              />
            </Field>
            {mostrarDizimista && (
              <Field label="Dizimista (opcional)" hint="Visível apenas para a administração.">
                <ComboBox
                  value={lancamento.membroId ?? ''}
                  onChange={(membroId) => setLancamento({ ...lancamento, membroId })}
                  options={membros.map((m) => ({ id: m.memberId, label: m.nome }))}
                  placeholder="Buscar pessoa..."
                  emptyLabel="— não vincular a uma pessoa —"
                />
              </Field>
            )}
            {mostrarCampanha && (
              <Field label="Meta (opcional)" hint="Soma o valor arrecadado desta meta.">
                <select
                  className={inputCls}
                  value={lancamento.campanhaId ?? ''}
                  onChange={(e) => setLancamento({ ...lancamento, campanhaId: e.target.value })}
                >
                  <option value="">— não vincular a uma meta —</option>
                  {campanhas.map((c) => (
                    <option key={c.campanhaId} value={c.campanhaId}>{c.titulo}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Descrição">
              <input
                className={inputCls}
                value={lancamento.descricao ?? ''}
                onChange={(e) => setLancamento({ ...lancamento, descricao: e.target.value })}
                placeholder="Detalhes do lançamento"
              />
            </Field>
            {lancamento.tipo === 'saida' && (
              <div className="sm:col-span-2">
                <Field
                  label={lancamento.comprovanteKey ? 'Trocar comprovante (opcional)' : 'Comprovante (obrigatório para saídas)'}
                  hint="Fica visível para todos em Entradas e Saídas."
                >
                  {lancamento.comprovanteUrl && (
                    <button
                      type="button"
                      onClick={() => setComprovanteAberto(lancamento.comprovanteUrl!)}
                      className="inline-flex items-center gap-1 text-accentStrong hover:underline text-[12.5px] mb-1.5"
                    >
                      <IconPaperclip className="icon w-3.5 h-3.5" /> Ver comprovante atual
                    </button>
                  )}
                  <input
                    type="file"
                    className={inputCls}
                    onChange={(e) => setComprovante(e.target.files?.[0] ?? null)}
                  />
                </Field>
              </div>
            )}
          </div>
          <div className="px-4.5 pb-4.5 flex flex-col gap-3.5">
            {erro && <p className="text-expense text-xs">{erro}</p>}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button type="submit" variant="info" className="justify-center">
                Salvar alterações
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/lancamentos')} className="justify-center">
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        aberto={confirmando}
        titulo="Confirmar alteração"
        mensagem="Você está prestes a salvar alterações neste lançamento."
        onCancelar={() => setConfirmando(false)}
        onConfirmar={salvar}
      />

      {comprovanteAberto && <AttachmentViewer url={comprovanteAberto} onClose={() => setComprovanteAberto(null)} />}
    </div>
  );
}
