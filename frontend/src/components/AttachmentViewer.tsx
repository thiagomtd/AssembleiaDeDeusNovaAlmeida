import { useEffect } from 'react';
import { IconX } from './icons';

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

function extensaoDaUrl(url: string) {
  const semQuery = url.split('?')[0];
  const match = semQuery.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
}

export function AttachmentViewer({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', aoTeclar);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const ext = extensaoDaUrl(url);
  const isImage = IMAGE_EXT.includes(ext);
  const isPdf = ext === 'pdf';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
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

      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[92vw] h-[86vh] flex items-center justify-center">
        {isImage && <img src={url} alt="Comprovante" className="max-w-[92vw] max-h-[86vh] object-contain rounded-lg" />}
        {isPdf && <iframe src={url} title="Comprovante" className="w-full h-full bg-white rounded-lg" />}
        {!isImage && !isPdf && (
          <div className="bg-surface rounded-lg p-6 text-center max-w-sm">
            <p className="text-ink text-sm mb-3">Não é possível pré-visualizar este tipo de arquivo aqui.</p>
            <a href={url} target="_blank" rel="noreferrer" className="text-accentStrong font-semibold text-sm underline">
              Abrir em nova aba
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
