import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Button, Field, inputCls, ComboBox } from '../../components/ui';

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

export function NovoLancamento() {
  const navigate = useNavigate();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [form, setForm] = useState({
    tipo: 'entrada', categoria: 'Dízimo', valor: '', data: '', membroId: '', campanhaId: '', descricao: '',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [comprovante, setComprovante] = useState<File | null>(null);

  useEffect(() => {
    api.get<Membro[]>('/members').then(setMembros).catch(() => setMembros([]));
    api.get<Campanha[]>('/campanhas').then((r) => setCampanhas(r.filter((c) => c.ativa))).catch(() => setCampanhas([]));
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mostrarDizimista = form.tipo === 'entrada' && form.categoria === 'Dízimo';
  const mostrarCampanha = form.tipo === 'entrada' && campanhas.length > 0;

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    const valor = Number(form.valor.replace(',', '.'));
    if (!valor || valor <= 0) {
      setErro('Informe um valor válido.');
      return;
    }
    if (!form.data) {
      setErro('Informe a data do lançamento.');
      return;
    }
    if (form.tipo === 'saida' && !comprovante) {
      setErro('Anexe um comprovante para registrar uma saída.');
      return;
    }
    setSalvando(true);
    try {
      const membro = membros.find((m) => m.memberId === form.membroId);
      const campanha = campanhas.find((c) => c.campanhaId === form.campanhaId);
      const comprovanteKey = form.tipo === 'saida' && comprovante ? await enviarComprovante(comprovante) : undefined;
      await api.post('/transactions', {
        tipo: form.tipo,
        categoria: form.categoria,
        valor,
        data: form.data,
        descricao: form.descricao,
        membroId: mostrarDizimista && form.membroId ? form.membroId : undefined,
        membroNome: mostrarDizimista && membro ? membro.nome : undefined,
        campanhaId: mostrarCampanha && form.campanhaId ? form.campanhaId : undefined,
        campanhaTitulo: mostrarCampanha && campanha ? campanha.titulo : undefined,
        comprovanteKey,
      });
      navigate('/admin/lancamentos');
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível salvar o lançamento.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card>
      <form onSubmit={salvar}>
        <div className="grid sm:grid-cols-2 gap-3.5 p-4.5">
          <Field label="Tipo">
            <select className={inputCls} value={form.tipo} onChange={set('tipo')}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </Field>
          <Field label="Categoria">
            <select className={inputCls} value={form.categoria} onChange={set('categoria')}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Valor (R$)">
            <input required className={inputCls} value={form.valor} onChange={set('valor')} placeholder="0,00" inputMode="decimal" />
          </Field>
          <Field label="Data">
            <input required type="date" className={inputCls} value={form.data} onChange={set('data')} />
          </Field>
          {mostrarDizimista && (
            <Field label="Dizimista (opcional)" hint="Visível apenas para a administração.">
              <ComboBox
                value={form.membroId}
                onChange={(membroId) => setForm((f) => ({ ...f, membroId }))}
                options={membros.map((m) => ({ id: m.memberId, label: m.nome }))}
                placeholder="Buscar pessoa..."
                emptyLabel="— não vincular a uma pessoa —"
              />
            </Field>
          )}
          {mostrarCampanha && (
            <Field label="Meta (opcional)" hint="Soma o valor arrecadado desta meta.">
              <select className={inputCls} value={form.campanhaId} onChange={set('campanhaId')}>
                <option value="">— não vincular a uma meta —</option>
                {campanhas.map((c) => (
                  <option key={c.campanhaId} value={c.campanhaId}>{c.titulo}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Descrição">
            <input className={inputCls} value={form.descricao} onChange={set('descricao')} placeholder="Detalhes do lançamento" />
          </Field>
          {form.tipo === 'saida' && (
            <div className="sm:col-span-2">
              <Field label="Comprovante (obrigatório para saídas)" hint="Fica visível para todos em Entradas e Saídas.">
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
            <Button type="submit" variant="success" disabled={salvando} className="justify-center">
              {salvando ? 'Salvando...' : 'Salvar lançamento'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/lancamentos')} className="justify-center">
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
