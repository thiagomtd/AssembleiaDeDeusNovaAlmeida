import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Button, Field, inputCls } from '../../components/ui';
import { IconChevronLeft } from '../../components/icons';

interface Campanha {
  campanhaId: string;
  titulo: string;
  descricao: string;
  meta: number;
  arrecadado: number;
  dataFim: string;
  ativa: boolean;
}

export function EditarCampanha() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const campanhaDoState = (location.state as { campanha?: Campanha } | null)?.campanha;

  const [campanha, setCampanha] = useState<Campanha | null>(campanhaDoState ?? null);
  const [carregando, setCarregando] = useState(!campanhaDoState);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (campanhaDoState) return;
    api
      .get<Campanha[]>('/campanhas')
      .then((lista) => setCampanha(lista.find((c) => c.campanhaId === id) ?? null))
      .finally(() => setCarregando(false));
  }, [id, campanhaDoState]);

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!campanha) return;
    setErro('');
    if (!campanha.titulo.trim()) {
      setErro('Informe o título da campanha.');
      return;
    }
    if (!campanha.meta || campanha.meta <= 0) {
      setErro('Informe uma meta válida.');
      return;
    }
    setSalvando(true);
    try {
      await api.put(`/campanhas/${campanha.campanhaId}`, {
        titulo: campanha.titulo,
        descricao: campanha.descricao,
        meta: Number(campanha.meta),
        dataFim: campanha.dataFim,
        ativa: campanha.ativa,
      });
      navigate('/admin/campanhas');
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <p className="text-sm text-muted text-center py-10">Carregando...</p>;
  if (!campanha) return <p className="text-sm text-muted text-center py-10">Campanha não encontrada.</p>;

  return (
    <div>
      <button
        onClick={() => navigate('/admin/campanhas')}
        className="inline-flex items-center gap-1 text-[12.5px] text-inkSecondary mb-4"
      >
        <IconChevronLeft className="icon w-[13px] h-[13px]" /> Voltar para Campanhas
      </button>

      <Card>
        <form onSubmit={salvar}>
          <div className="grid sm:grid-cols-2 gap-3.5 p-4.5">
            <div className="sm:col-span-2">
              <Field label="Título">
                <input
                  required
                  className={inputCls}
                  value={campanha.titulo}
                  onChange={(e) => setCampanha({ ...campanha, titulo: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Descrição (opcional)">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={campanha.descricao}
                  onChange={(e) => setCampanha({ ...campanha, descricao: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Meta (R$)">
              <input
                required
                className={inputCls}
                value={campanha.meta}
                onChange={(e) => setCampanha({ ...campanha, meta: Number(e.target.value.replace(',', '.')) || 0 })}
              />
            </Field>
            <Field label="Prazo (opcional)">
              <input
                type="date"
                className={inputCls}
                value={campanha.dataFim}
                onChange={(e) => setCampanha({ ...campanha, dataFim: e.target.value })}
              />
            </Field>
            <Field label="Arrecadado até agora" hint="Calculado automaticamente pelos lançamentos vinculados.">
              <input className={`${inputCls} opacity-60`} value={campanha.arrecadado} disabled />
            </Field>
            <Field label="Status">
              <select
                className={inputCls}
                value={campanha.ativa ? 'ativa' : 'encerrada'}
                onChange={(e) => setCampanha({ ...campanha, ativa: e.target.value === 'ativa' })}
              >
                <option value="ativa">Ativa</option>
                <option value="encerrada">Encerrada</option>
              </select>
            </Field>
          </div>
          <div className="px-4.5 pb-4.5 flex flex-col gap-3.5">
            {erro && <p className="text-expense text-xs">{erro}</p>}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button type="submit" variant="gold" disabled={salvando} className="justify-center">
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/campanhas')} className="justify-center">
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
