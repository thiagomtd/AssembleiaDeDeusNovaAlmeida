import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, Eyebrow } from '../components/ui';
import { IconGift, IconLock } from '../components/icons';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type Aniversariante = { nome: string; dia: number };

export function Aniversariantes() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [lista, setLista] = useState<Aniversariante[]>([]);
  const [carregando, setCarregando] = useState(true);

  const mesStr = String(mes).padStart(2, '0');

  useEffect(() => {
    setCarregando(true);
    api
      .get<{ aniversariantes: Aniversariante[] }>(`/aniversariantes?mes=${mesStr}`)
      .then((r) => setLista(r.aniversariantes))
      .catch(() => setLista([]))
      .finally(() => setCarregando(false));
  }, [mesStr]);

  return (
    <section>
      <Eyebrow icon={<IconGift className="icon w-3 h-3" />}>Comunidade</Eyebrow>
      <h1 className="text-[32px] mb-1.5 text-ink">Aniversariantes</h1>
      <p className="text-inkSecondary text-[14.5px] max-w-[62ch] mb-6">
        Membros que fazem aniversário neste mês, para a igreja celebrar junto.
      </p>

      <Card className="p-3.5 flex items-center justify-between gap-2.5 flex-wrap mb-5">
        <select
          className="min-w-0 max-w-full bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-[13px] text-ink"
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
        >
          {MESES.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <span className="text-[12.5px] text-muted">
          <strong className="text-ink">{lista.length}</strong> aniversariante{lista.length === 1 ? '' : 's'} em{' '}
          {MESES[mes - 1].toLowerCase()}
        </span>
      </Card>

      <div className="grid sm:grid-cols-3 gap-2.5 mb-5">
        {lista.map((a) => (
          <div
            key={`${a.dia}-${a.nome}`}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-surface2 border border-border"
          >
            <span className="w-9 h-9 flex-none rounded-lg bg-accentSoft text-accent font-semibold text-[13px] flex items-center justify-center">
              {String(a.dia).padStart(2, '0')}
            </span>
            <span className="text-[13px] font-semibold text-ink truncate">{a.nome}</span>
          </div>
        ))}
        {!carregando && lista.length === 0 && (
          <p className="col-span-full text-sm text-muted py-6 text-center">
            Nenhum aniversariante em {MESES[mes - 1].toLowerCase()}.
          </p>
        )}
      </div>

      <div className="flex gap-2.5 items-start bg-surface2 border border-border rounded-xl px-4 py-3.5 text-[12.5px] text-inkSecondary">
        <IconLock className="icon w-[17px] h-[17px] text-muted mt-0.5" />
        <span>Por privacidade, apenas o dia é exibido — o ano de nascimento nunca aparece aqui.</span>
      </div>
    </section>
  );
}
