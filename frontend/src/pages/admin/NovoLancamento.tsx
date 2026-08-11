import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Button, Field, inputCls } from '../../components/ui';

const CATEGORIAS = ['Dízimo', 'Oferta', 'Doação', 'Contas', 'Manutenção', 'Eventos', 'Outros'];

interface Membro {
  memberId: string;
  nome: string;
}

export function NovoLancamento() {
  const navigate = useNavigate();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [form, setForm] = useState({
    tipo: 'entrada', categoria: 'Dízimo', valor: '', data: '', membroId: '', descricao: '',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get<Membro[]>('/members').then(setMembros).catch(() => setMembros([]));
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mostrarDizimista = form.tipo === 'entrada' && form.categoria === 'Dízimo';

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
    setSalvando(true);
    try {
      const membro = membros.find((m) => m.memberId === form.membroId);
      await api.post('/transactions', {
        tipo: form.tipo,
        categoria: form.categoria,
        valor,
        data: form.data,
        descricao: form.descricao,
        membroId: mostrarDizimista && form.membroId ? form.membroId : undefined,
        membroNome: mostrarDizimista && membro ? membro.nome : undefined,
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
              <select className={inputCls} value={form.membroId} onChange={set('membroId')}>
                <option value="">— não vincular a uma pessoa —</option>
                {membros.map((m) => (
                  <option key={m.memberId} value={m.memberId}>{m.nome}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Descrição">
            <input className={inputCls} value={form.descricao} onChange={set('descricao')} placeholder="Detalhes do lançamento" />
          </Field>
        </div>
        <div className="px-4.5 pb-4.5 flex flex-col gap-3.5">
          {erro && <p className="text-expense text-xs">{erro}</p>}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button type="submit" variant="gold" disabled={salvando} className="justify-center">
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
