import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, Eyebrow, Pill, fmtBRL } from '../components/ui';
import { IconTarget } from '../components/icons';

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
  const [lista, setLista] = useState<Campanha[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api
      .get<Campanha[]>('/campanhas')
      .then(setLista)
      .catch(() => setLista([]))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <section>
      <Eyebrow icon={<IconTarget className="icon w-3 h-3" />}>Metas</Eyebrow>
      <h1 className="text-[32px] mb-1.5 text-ink">Metas de Arrecadação</h1>
      <p className="text-inkSecondary text-[14.5px] max-w-[62ch] mb-6">
        Acompanhe o andamento das metas da igreja, como reformas e projetos especiais.
      </p>

      <div className="grid sm:grid-cols-2 gap-3.5">
        {lista.map((c) => {
          const pct = Math.min(100, Math.round((c.arrecadado / c.meta) * 100));
          return (
            <Card key={c.campanhaId} className="p-4.5">
              <div className="flex items-start justify-between gap-2.5 mb-1.5">
                <h2 className="font-serif text-lg text-ink">{c.titulo}</h2>
                <Pill tone={c.ativa ? 'active' : 'inactive'}>{c.ativa ? 'Ativa' : 'Encerrada'}</Pill>
              </div>
              {c.descricao && <p className="text-[13px] text-inkSecondary mb-3.5">{c.descricao}</p>}

              <div className="h-2.5 rounded-full bg-surface2 overflow-hidden mb-2">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-baseline justify-between gap-2.5 text-[13px]">
                <span className="font-semibold text-ink">{fmtBRL(c.arrecadado)}</span>
                <span className="text-muted">
                  {pct}% de {fmtBRL(c.meta)}
                </span>
              </div>
              {c.dataFim && (
                <p className="text-[11.5px] text-muted mt-2">
                  Até {new Date(c.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
            </Card>
          );
        })}
        {!carregando && lista.length === 0 && (
          <p className="col-span-full text-sm text-muted py-8 text-center">Nenhuma meta no momento.</p>
        )}
      </div>
    </section>
  );
}
