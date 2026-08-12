import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui';
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
      <span className="inline-block py-1 px-3 bg-coastMist rounded-full text-[10px] font-bold uppercase tracking-widest text-coastOcean mb-5">
        Galeria
      </span>
      <h1 className="font-serif text-[32px] sm:text-[40px] mb-3 text-coastInk">Momentos de Culto</h1>
      <p className="text-inkSecondary text-[14.5px] max-w-[62ch] mb-7 leading-relaxed">
        Fotos e vídeos das nossas celebrações e encontros, organizados por culto. Cada imagem carrega uma história de
        fé e comunhão.
      </p>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2.5">
        <span className="text-[12.5px] text-muted">{cultos.length} cultos publicados</span>
        {podeGerenciarMidia && (
          <Link to="/admin/cultos">
            <span className="inline-flex items-center gap-1.5 bg-success text-white text-[12.5px] font-semibold rounded-lg px-3 py-1.5 hover:opacity-90">
              <IconPlus className="icon w-3.5 h-3.5" /> Publicar mídia de um culto
            </span>
          </Link>
        )}
      </div>

      {cultos.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cultos.map((c) => (
            <Link key={c.cultoId} to={`/midia/${c.cultoId}`}>
              <Card className="overflow-hidden hover:-translate-y-0.5 transition-transform cursor-pointer rounded-2xl">
                <div className="aspect-square bg-coastMist flex items-center justify-center relative overflow-hidden">
                  {c.capaUrl ? (
                    c.capaTipo === 'video' ? (
                      <video src={c.capaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                    ) : (
                      <img src={c.capaUrl} alt={c.titulo} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center text-coastOcean">
                      <IconImage className="icon w-5 h-5" />
                    </span>
                  )}
                  <span className="absolute bottom-2.5 left-2.5 bg-black/60 rounded-full px-2.5 py-1 text-[11px] text-white flex gap-2.5 items-center">
                    <span className="flex items-center gap-1"><IconCamera className="icon w-2.5 h-2.5" />{c.fotos}</span>
                    <span className="flex items-center gap-1"><IconVideo className="icon w-2.5 h-2.5" />{c.videos}</span>
                  </span>
                </div>
                <div className="px-4 py-3.5 text-center">
                  <h3 className="font-serif text-[16px] mb-1 text-coastInk">{c.titulo}</h3>
                  <p className="text-xs text-muted">{c.data.split('-').reverse().join('/')}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        !carregando && (
          <div className="aspect-square max-w-[280px] mx-auto bg-coastMist rounded-2xl flex flex-col items-center justify-center text-center p-6">
            <span className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center text-coastOcean mb-4">
              <IconImage className="icon w-5 h-5" />
            </span>
            <p className="text-sm font-medium text-coastInk/70">Nenhum culto publicado</p>
            <p className="text-xs text-coastInk/40 mt-1">Em breve</p>
          </div>
        )
      )}
    </section>
  );
}
