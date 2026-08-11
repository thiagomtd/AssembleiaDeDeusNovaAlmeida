import { useEffect } from 'react';
import { IconX, IconArrowLeft, IconArrowRight } from './icons';

export interface LightboxItem {
  tipo: 'foto' | 'video';
  url: string;
}

export function Lightbox({
  itens,
  index,
  onClose,
  onNavigate,
}: {
  itens: LightboxItem[];
  index: number;
  onClose: () => void;
  onNavigate: (novoIndex: number) => void;
}) {
  const total = itens.length;
  const item = itens[index];

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % total);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + total) % total);
    };
    window.addEventListener('keydown', aoTeclar);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = '';
    };
  }, [index, total, onClose, onNavigate]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
        aria-label="Fechar"
      >
        <IconX className="icon w-5 h-5" />
      </button>

      {total > 1 && (
        <span className="absolute top-4 left-4 text-white/70 text-[12.5px]">
          {index + 1} / {total}
        </span>
      )}

      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + total) % total); }}
          className="absolute left-2 sm:left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white flex-none"
          aria-label="Anterior"
        >
          <IconArrowLeft className="icon w-5 h-5" />
        </button>
      )}

      <div onClick={(e) => e.stopPropagation()} className="max-w-[92vw] max-h-[86vh] flex items-center justify-center">
        {item.tipo === 'video' ? (
          <video src={item.url} controls autoPlay className="max-w-[92vw] max-h-[86vh] rounded-lg" />
        ) : (
          <img src={item.url} alt="" className="max-w-[92vw] max-h-[86vh] object-contain rounded-lg" />
        )}
      </div>

      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % total); }}
          className="absolute right-2 sm:right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white flex-none"
          aria-label="Próximo"
        >
          <IconArrowRight className="icon w-5 h-5" />
        </button>
      )}
    </div>
  );
}
