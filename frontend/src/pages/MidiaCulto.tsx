import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Card } from '../components/ui';
import { Lightbox } from '../components/Lightbox';
import { IconVideo, IconChevronLeft } from '../components/icons';

interface MediaItem {
  mediaId: string;
  tipo: 'foto' | 'video';
  url: string;
}

export function MidiaCulto() {
  const { cultoId } = useParams();
  const [itens, setItens] = useState<MediaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState<number | null>(null);

  useEffect(() => {
    if (!cultoId) return;
    api
      .get<MediaItem[]>(`/cultos/${cultoId}/midia`)
      .then(setItens)
      .catch(() => setItens([]))
      .finally(() => setCarregando(false));
  }, [cultoId]);

  return (
    <section>
      <Link to="/midia" className="inline-flex items-center gap-1 text-[12.5px] text-inkSecondary mb-4">
        <IconChevronLeft className="icon w-[13px] h-[13px]" /> Voltar para Mídia do Culto
      </Link>

      <Card className="p-5">
        <p className="text-[12.5px] text-muted mb-4">{itens.length} itens de mídia</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {itens.map((item, i) => (
            <button
              key={item.mediaId}
              onClick={() => setAberto(i)}
              className="relative aspect-square rounded-xl bg-surface2 border border-border overflow-hidden block"
              title="Ver em tamanho maior"
            >
              {item.tipo === 'video' ? (
                <>
                  <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
                      <IconVideo className="icon w-4 h-4 text-white" />
                    </span>
                  </span>
                </>
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              )}
              <span className="absolute top-1.5 left-1.5 bg-black/55 rounded-md px-1.5 py-0.5 text-[10px] text-white pointer-events-none">
                {item.tipo === 'video' ? 'vídeo' : 'foto'}
              </span>
            </button>
          ))}
          {!carregando && itens.length === 0 && (
            <p className="col-span-full text-sm text-muted py-10 text-center">Nenhuma mídia publicada para este culto.</p>
          )}
        </div>
      </Card>

      {aberto !== null && (
        <Lightbox itens={itens} index={aberto} onClose={() => setAberto(null)} onNavigate={setAberto} />
      )}
    </section>
  );
}
