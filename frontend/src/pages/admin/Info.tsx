import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { Card, Button, Field, inputCls } from '../../components/ui';
import { IconPlus, IconTrash } from '../../components/icons';

interface Horario { dia: string; horario: string }
interface ChurchInfo {
  textoInstitucional: string;
  endereco: string;
  mapaEmbedUrl: string;
  horarios: Horario[];
}

export function Info() {
  const [form, setForm] = useState<ChurchInfo>({ textoInstitucional: '', endereco: '', mapaEmbedUrl: '', horarios: [] });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    api.get<ChurchInfo>('/church-info').then((r) =>
      setForm({
        textoInstitucional: r.textoInstitucional ?? '',
        endereco: r.endereco ?? '',
        mapaEmbedUrl: r.mapaEmbedUrl ?? '',
        horarios: r.horarios ?? [],
      }),
    );
  }, []);

  const atualizarHorario = (i: number, campo: keyof Horario, valor: string) => {
    setForm((f) => {
      const horarios = [...f.horarios];
      horarios[i] = { ...horarios[i], [campo]: valor };
      return { ...f, horarios };
    });
  };
  const removerHorario = (i: number) => setForm((f) => ({ ...f, horarios: f.horarios.filter((_, idx) => idx !== i) }));
  const adicionarHorario = () => setForm((f) => ({ ...f, horarios: [...f.horarios, { dia: '', horario: '' }] }));

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setSalvo(false);
    try {
      await api.put('/church-info', form);
      setSalvo(true);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card>
      <form onSubmit={salvar} className="grid sm:grid-cols-2 gap-3.5 p-4.5">
        <div className="sm:col-span-2">
          <Field label="Texto institucional">
            <textarea
              rows={3}
              className={inputCls}
              value={form.textoInstitucional}
              onChange={(e) => setForm((f) => ({ ...f, textoInstitucional: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Endereço">
          <input className={inputCls} value={form.endereco} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} />
        </Field>
        <Field label="Link do mapa (embed)">
          <input className={inputCls} value={form.mapaEmbedUrl} onChange={(e) => setForm((f) => ({ ...f, mapaEmbedUrl: e.target.value }))} placeholder="https://maps.google.com/..." />
        </Field>

        <div className="sm:col-span-2">
          <span className="text-xs text-inkSecondary font-semibold block mb-2">Horários de culto</span>
          <div className="flex flex-col gap-2.5">
            {form.horarios.map((h, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-end bg-surface2 border border-border rounded-xl p-2.5">
                <div className="w-full sm:w-[150px] sm:flex-none min-w-0">
                  <span className="text-[10.5px] text-muted font-semibold block mb-1">Dia</span>
                  <input className={inputCls} value={h.dia} onChange={(e) => atualizarHorario(i, 'dia', e.target.value)} placeholder="Domingo" />
                </div>
                <div className="flex gap-2 items-end w-full min-w-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10.5px] text-muted font-semibold block mb-1">Horário</span>
                    <input className={inputCls} value={h.horario} onChange={(e) => atualizarHorario(i, 'horario', e.target.value)} placeholder="18h — Culto de Celebração" />
                  </div>
                  <button type="button" onClick={() => removerHorario(i)} className="w-[38px] h-[38px] rounded-lg border border-border flex items-center justify-center text-inkSecondary flex-none">
                    <IconTrash className="icon w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" size="sm" variant="secondary" className="mt-2.5" onClick={adicionarHorario}>
            <IconPlus className="icon w-3.5 h-3.5" /> Adicionar horário
          </Button>
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <Button type="submit" variant="gold" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </Button>
          {salvo && <span className="text-income text-xs font-semibold">Salvo com sucesso.</span>}
        </div>
      </form>
    </Card>
  );
}
