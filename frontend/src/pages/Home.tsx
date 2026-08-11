import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, Eyebrow } from '../components/ui';
import { Emblem, IconBook, IconClock, IconPin, IconImage, IconVideo } from '../components/icons';

interface ChurchInfo {
  textoInstitucional: string;
  endereco: string;
  mapaEmbedUrl: string;
  horarios: { dia: string; horario: string }[];
}

interface CultoCapa {
  cultoId: string;
  titulo: string;
  data: string;
  capaUrl: string;
  capaTipo: 'foto' | 'video';
}

export function Home() {
  const [info, setInfo] = useState<ChurchInfo | null>(null);
  const [cultos, setCultos] = useState<CultoCapa[]>([]);

  useEffect(() => {
    api.get<ChurchInfo>('/church-info').then(setInfo).catch(() => {});
    api.get<CultoCapa[]>('/cultos/public').then(setCultos).catch(() => {});
  }, []);

  return (
    <section>
      <div className="pt-1.5 pb-8 border-b border-border mb-7">
        <Emblem className="w-14 h-14 mb-5" />
        <Eyebrow icon={<IconBook className="icon w-3 h-3" />}>Bem-vindos</Eyebrow>
        <h1 className="text-[28px] mb-3 max-w-[22ch] text-ink">Assembleia de Deus de Nova Almeida</h1>
        <p className="text-inkSecondary text-[14.5px] leading-relaxed max-w-[60ch]">
          {info?.textoInstitucional ||
            'Uma comunidade de fé, família e esperança. Anunciando o Evangelho e servindo a comunidade de Nova Almeida.'}
        </p>
        <p className="text-[11px] tracking-[0.16em] uppercase text-accentStrong mt-4">Fé · Família · Esperança</p>
      </div>

      <div className="flex items-baseline justify-between mb-3.5">
        <h2 className="text-[19px] text-ink">Galeria</h2>
        <span className="text-xs text-muted">entre para ver tudo em Mídia do Culto</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-7">
        {cultos.length === 0 && (
          <p className="col-span-full text-sm text-muted">Nenhuma foto publicada ainda.</p>
        )}
        {cultos.map((c) => (
          <Link
            key={c.cultoId}
            to={`/midia/${c.cultoId}`}
            title={c.titulo}
            className="relative aspect-[4/3] rounded-xl bg-surface2 border border-border overflow-hidden flex items-end cursor-pointer transition-transform hover:-translate-y-0.5"
          >
            {c.capaTipo === 'video' ? (
              <video src={c.capaUrl} className="absolute inset-0 w-full h-full object-cover" muted preload="metadata" />
            ) : (
              <img src={c.capaUrl} alt={c.titulo} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            )}
            <span className="relative m-2 px-2 py-1 rounded-md bg-black/55 text-white text-[11px] flex items-center gap-1">
              {c.capaTipo === 'video' ? <IconVideo className="icon w-3 h-3" /> : <IconImage className="icon w-3 h-3" />}
              {c.titulo}
            </span>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4.5 gap-y-4">
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-[13.5px] mb-3.5 text-ink">
            <IconClock className="icon w-[15px] h-[15px] text-muted" /> Horários de culto
          </h3>
          <div>
            {(info?.horarios ?? []).map((h, i) => (
              <div key={i} className="flex justify-between py-2 text-[13.5px] border-b border-dashed border-border last:border-none">
                <span>{h.dia}</span>
                <span>{h.horario}</span>
              </div>
            ))}
            {(!info || info.horarios.length === 0) && <p className="text-sm text-muted">A definir.</p>}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-[13.5px] mb-3.5 text-ink">
            <IconPin className="icon w-[15px] h-[15px] text-muted" /> Como chegar
          </h3>
          <p className="text-[13.5px] text-inkSecondary mb-2.5">{info?.endereco || 'Endereço a definir.'}</p>
          <div className="h-[150px] rounded-lg border border-border bg-surface2 flex items-center justify-center text-muted text-xs gap-1.5">
            {info?.mapaEmbedUrl ? (
              <iframe title="mapa" src={info.mapaEmbedUrl} className="w-full h-full rounded-lg border-0" />
            ) : (
              <>
                <IconPin className="icon w-[15px] h-[15px]" /> mapa não configurado
              </>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
