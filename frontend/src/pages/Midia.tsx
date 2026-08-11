import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card, Eyebrow } from '../components/ui';
import { IconImage, IconCamera, IconVideo, IconPlus } from '../components/icons';

interface Culto {
  cultoId: string;
  data: string;
  titulo: string;
  fotos: number;
  videos: number;
  capaUrl: string | null;
  capaTipo: 'foto' | 'video' | null;
}

export function Midia() {
  const { isAdmin, isMidia } = useAuth();
  const podeGerenciarMidia = isAdmin || isMidia;
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api
      .get<Culto[]>('/cultos')
      .then(setCultos)
      .catch(() => setCultos([]))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <section>
      <Eyebrow icon={<IconImage className="icon w-3 h-3" />}>Memórias</Eyebrow>
      <h1 className="text-[27px] mb-1.5 text-ink">Mídia do Culto</h1>
      <p className="text-inkSecondary text-[14.5px] max-w-[62ch] mb-6">
        Fotos e vídeos de cada culto, organizados por data. Baixe individualmente ou tudo de uma vez.
      </p>

      <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2.5">
        <span className="text-[12.5px] text-muted">{cultos.length} cultos publicados</span>
        {podeGerenciarMidia && (
          <Link to="/admin/cultos">
            <span className="inline-flex items-center gap-1.5 bg-accent text-[#241703] text-[12.5px] font-semibold rounded-lg px-3 py-1.5">
              <IconPlus className="icon w-3.5 h-3.5" /> Publicar mídia de um culto
            </span>
          </Link>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cultos.map((c) => (
          <Link key={c.cultoId} to={`/midia/${c.cultoId}`}>
            <Card className="overflow-hidden hover:-translate-y-0.5 transition-transform cursor-pointer">
              <div className="h-[120px] bg-surface2 border-b border-border flex items-center justify-center relative overflow-hidden">
                {c.capaUrl ? (
                  c.capaTipo === 'video' ? (
                    <video src={c.capaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                  ) : (
                    <img src={c.capaUrl} alt={c.titulo} className="w-full h-full object-cover" />
                  )
                ) : (
                  <IconImage className="icon w-6 h-6 text-muted" />
                )}
                <span className="absolute bottom-2 left-2 bg-black/60 rounded-full px-2.5 py-1 text-[11px] text-white flex gap-2.5 items-center">
                  <span className="flex items-center gap-1"><IconCamera className="icon w-2.5 h-2.5" />{c.fotos}</span>
                  <span className="flex items-center gap-1"><IconVideo className="icon w-2.5 h-2.5" />{c.videos}</span>
                </span>
              </div>
              <div className="px-4 py-3.5">
                <h3 className="text-[14.5px] mb-1 text-ink">{c.titulo}</h3>
                <p className="text-xs text-muted">{c.data.split('-').reverse().join('/')}</p>
              </div>
            </Card>
          </Link>
        ))}
        {!carregando && cultos.length === 0 && (
          <p className="col-span-full text-sm text-muted py-10 text-center">Nenhum culto publicado ainda.</p>
        )}
      </div>
    </section>
  );
}
