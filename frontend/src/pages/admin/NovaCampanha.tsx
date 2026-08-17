import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Button, Field, inputCls } from '../../components/ui';

export function NovaCampanha() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ titulo: '', descricao: '', meta: '', dataFim: '' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    const meta = Number(form.meta.replace(',', '.'));
    if (!form.titulo.trim()) {
      setErro('Informe o título da meta.');
      return;
    }
    if (!meta || meta <= 0) {
      setErro('Informe uma meta válida.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/campanhas', {
        titulo: form.titulo,
        descricao: form.descricao,
        meta,
        dataFim: form.dataFim || undefined,
      });
      navigate('/admin/campanhas');
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível salvar a meta.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card>
      <form onSubmit={salvar}>
        <div className="grid sm:grid-cols-2 gap-3.5 p-4.5">
          <div className="sm:col-span-2">
            <Field label="Título">
              <input required className={inputCls} value={form.titulo} onChange={set('titulo')} placeholder="Reforma do templo" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Descrição (opcional)">
              <textarea rows={2} className={inputCls} value={form.descricao} onChange={set('descricao')} />
            </Field>
          </div>
          <Field label="Meta (R$)">
            <input required className={inputCls} value={form.meta} onChange={set('meta')} placeholder="0,00" inputMode="decimal" />
          </Field>
          <Field label="Prazo (opcional)">
            <input type="date" className={inputCls} value={form.dataFim} onChange={set('dataFim')} />
          </Field>
        </div>
        <div className="px-4.5 pb-4.5 flex flex-col gap-3.5">
          {erro && <p className="text-expense text-xs">{erro}</p>}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button type="submit" variant="success" disabled={salvando} className="justify-center">
              {salvando ? 'Salvando...' : 'Salvar meta'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/campanhas')} className="justify-center">
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
