import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, Eyebrow } from '../components/ui';
import { IconUsers, IconCheck } from '../components/icons';
import { MonthPicker } from '../components/MonthPicker';

export function Dizimistas() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [nomes, setNomes] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  const mesAno = `${ano}-${String(mes).padStart(2, '0')}`;

  useEffect(() => {
    setCarregando(true);
    api
      .get<{ dizimistas: string[] }>(`/dizimistas?mes=${mesAno}`)
      .then((r) => setNomes(r.dizimistas))
      .catch(() => setNomes([]))
      .finally(() => setCarregando(false));
  }, [mesAno]);

  return (
    <section>
      <Eyebrow icon={<IconUsers className="icon w-3 h-3" />}>Transparência</Eyebrow>
      <h1 className="text-[32px] mb-1.5 text-ink">Dizimistas do Mês</h1>
      <p className="text-inkSecondary text-[14.5px] max-w-[62ch] mb-6">
        Veja quem contribuiu com o dízimo neste mês. Por respeito à privacidade, os valores individuais não são
        exibidos aqui — apenas os totais agregados, disponíveis em Relatórios.
      </p>

      <Card className="p-3.5 flex items-center justify-between gap-2.5 flex-wrap mb-5">
        <MonthPicker mes={mes} ano={ano} onChange={(m, a) => { setMes(m); setAno(a); }} />
        <span className="text-[12.5px] text-muted">
          <strong className="text-ink">{nomes.length}</strong> dizimistas neste mês
        </span>
      </Card>

      <div className="grid sm:grid-cols-3 gap-2.5 mb-5">
        {nomes.map((n) => (
          <div key={n} className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-surface2 border border-border text-[13px] font-semibold text-ink">
            <IconCheck className="icon w-4 h-4 text-income" />
            {n}
          </div>
        ))}
        {!carregando && nomes.length === 0 && (
          <p className="col-span-full text-sm text-muted py-6 text-center">Nenhum dízimo registrado neste mês.</p>
        )}
      </div>
    </section>
  );
}
