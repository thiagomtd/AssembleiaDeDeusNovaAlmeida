import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/ui';
import { Emblem, IconBook, IconClock, IconPin, IconImage, IconVideo, IconCamera, IconArrowRight } from '../components/icons';

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
  const { isAuthenticated } = useAuth();
  const [info, setInfo] = useState<ChurchInfo | null>(null);
  const [cultos, setCultos] = useState<CultoCapa[]>([]);

  useEffect(() => {
    api.get<ChurchInfo>('/church-info').then(setInfo).catch(() => {});
    api.get<CultoCapa[]>('/cultos/public').then(setCultos).catch(() => {});
  }, []);

  const mapsUrl = info?.endereco
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}`
    : undefined;

  return (
    <section>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-[#10141f] text-white px-6 sm:px-11 py-10 sm:py-16 mb-9">
        <div className="absolute -right-16 -top-16 opacity-[0.08] pointer-events-none">
          <Emblem className="w-72 h-72" />
        </div>
        <div className="relative max-w-[640px]">
          <Emblem className="w-16 h-16 mb-6 ring-4 ring-white/10 rounded-full" />
          <p className="flex items-center gap-1.5 text-[11.5px] uppercase tracking-wider text-accentSoft font-bold mb-3">
            <IconBook className="icon w-3 h-3" /> Bem-vindos
          </p>
          <h1 className="font-serif text-[30px] sm:text-[40px] leading-[1.15] mb-4 text-white">
            Assembleia de Deus de Nova Almeida
          </h1>
          <p className="text-white/75 text-[15px] leading-relaxed max-w-[56ch] mb-5">
            {info?.textoInstitucional ||
              'Uma comunidade de fé, família e esperança. Anunciando o Evangelho e servindo a comunidade de Nova Almeida.'}
          </p>
          <p className="text-[11px] tracking-[0.18em] uppercase text-accentSoft/90 font-semibold mb-8">
            Fé · Família · Esperança
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={isAuthenticated ? '/midia' : '/entrar'}>
              <Button variant="gold">
                Ver mídia dos cultos <IconArrowRight className="icon w-3.5 h-3.5" />
              </Button>
            </Link>
            <a href="#horarios-local">
              <Button variant="outlineLight">Horários e localização</Button>
            </a>
          </div>
        </div>
      </div>

      {/* Galeria */}
      <div className="flex items-baseline justify-between mb-3.5">
        <h2 className="text-[19px] text-ink">Galeria</h2>
        {cultos.length > 0 && <span className="text-xs text-muted">entre para ver tudo em Mídia do Culto</span>}
      </div>
      {cultos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border bg-surface2 py-10 mb-9 text-center">
          <div className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center">
            <IconCamera className="icon w-5 h-5 text-muted" />
          </div>
          <p className="text-[13.5px] text-inkSecondary font-medium">Em breve, fotos e vídeos dos cultos por aqui.</p>
          <p className="text-xs text-muted max-w-[42ch]">A administração ainda não publicou nenhum culto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-9">
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
      )}

      {/* Horários e localização */}
      <div id="horarios-local" className="grid sm:grid-cols-2 gap-4.5 gap-y-4 scroll-mt-20">
        <Card className="p-5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
          <h3 className="flex items-center gap-2.5 text-[13.5px] mb-4 text-ink font-semibold">
            <span className="w-8 h-8 rounded-lg bg-accentSoft flex items-center justify-center flex-none">
              <IconClock className="icon w-4 h-4 text-accentStrong" />
            </span>
            Horários de culto
          </h3>
          <div>
            {(info?.horarios ?? []).map((h, i) => (
              <div key={i} className="flex justify-between py-2.5 text-[13.5px] border-b border-dashed border-border last:border-none">
                <span className="text-ink font-medium">{h.dia}</span>
                <span className="text-inkSecondary">{h.horario}</span>
              </div>
            ))}
            {(!info || info.horarios.length === 0) && <p className="text-sm text-muted">A definir.</p>}
          </div>
        </Card>
        <Card className="p-5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sage" />
          <h3 className="flex items-center gap-2.5 text-[13.5px] mb-4 text-ink font-semibold">
            <span className="w-8 h-8 rounded-lg bg-sage/15 flex items-center justify-center flex-none">
              <IconPin className="icon w-4 h-4 text-sage" />
            </span>
            Como chegar
          </h3>
          <p className="text-[13.5px] text-inkSecondary mb-3">{info?.endereco || 'Endereço a definir.'}</p>
          <div className="h-[150px] rounded-lg border border-border bg-surface2 flex items-center justify-center text-muted text-xs gap-1.5 overflow-hidden mb-2.5">
            {info?.mapaEmbedUrl ? (
              <iframe title="mapa" src={info.mapaEmbedUrl} className="w-full h-full rounded-lg border-0" />
            ) : (
              <>
                <IconPin className="icon w-[15px] h-[15px]" /> mapa não configurado
              </>
            )}
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accentStrong hover:underline"
            >
              Abrir no Google Maps <IconArrowRight className="icon w-3 h-3" />
            </a>
          )}
        </Card>
      </div>

      {/* Convite */}
      {!isAuthenticated && (
        <div className="mt-9 rounded-2xl border border-border bg-accentSoft/40 px-6 py-7 sm:px-9 flex flex-col sm:flex-row items-center gap-5 justify-between text-center sm:text-left">
          <div>
            <h3 className="font-serif text-[19px] text-ink mb-1.5">Já faz parte da igreja?</h3>
            <p className="text-[13.5px] text-inkSecondary max-w-[52ch]">
              Membros acompanham finanças, mídia dos cultos, campanhas e muito mais entrando na área restrita.
            </p>
          </div>
          <Link to="/entrar" className="flex-none">
            <Button variant="gold">
              Entrar <IconArrowRight className="icon w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
