import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { Card, Button, Field, inputCls } from '../../components/ui';
import { Lightbox } from '../../components/Lightbox';
import { IconCamera, IconVideo, IconTrash, IconPlus, IconImage } from '../../components/icons';

interface Culto {
  cultoId: string;
  data: string;
  titulo: string;
  fotos: number;
  videos: number;
  capaUrl: string | null;
  capaTipo: 'foto' | 'video' | null;
}
interface MediaItem {
  mediaId: string;
  tipo: 'foto' | 'video';
  url: string;
}

function extensaoDe(file: File) {
  const partes = file.name.split('.');
  return partes.length > 1 ? partes.pop()! : 'bin';
}
async function uploadArquivo(uploadUrl: string, file: File) {
  await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
}

export function Cultos() {
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoCulto, setNovoCulto] = useState({ data: '', titulo: '' });

  const [expandido, setExpandido] = useState<string | null>(null);
  const [midia, setMidia] = useState<MediaItem[]>([]);
  const [carregandoMidia, setCarregandoMidia] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = () => {
    setCarregando(true);
    api.get<Culto[]>('/cultos').then(setCultos).catch(() => setCultos([])).finally(() => setCarregando(false));
  };
  useEffect(carregar, []);

  const carregarMidiaDoExpandido = async (cultoId: string) => {
    setCarregandoMidia(true);
    try {
      const itens = await api.get<MediaItem[]>(`/cultos/${cultoId}/midia`);
      setMidia(itens);
    } finally {
      setCarregandoMidia(false);
    }
  };

  const abrirCulto = async (cultoId: string) => {
    if (expandido === cultoId) {
      setExpandido(null);
      return;
    }
    setExpandido(cultoId);
    await carregarMidiaDoExpandido(cultoId);
  };

  const criarCulto = async (e: FormEvent) => {
    e.preventDefault();
    if (!novoCulto.data || !novoCulto.titulo) return;
    const culto = await api.post<Culto>('/cultos', novoCulto);
    setNovoCulto({ data: '', titulo: '' });
    setMostrarForm(false);
    await carregar();
    setExpandido(culto.cultoId);
    setMidia([]);
  };

  const enviarMidia = async (cultoId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setEnviando(true);
    try {
      let ordem = midia.length;
      for (const file of Array.from(files)) {
        const tipo = file.type.startsWith('video') ? 'video' : 'foto';
        const { mediaId, s3Key, uploadUrl } = await api.post<{ mediaId: string; s3Key: string; uploadUrl: string }>(
          `/cultos/${cultoId}/midia/presign`,
          { contentType: file.type, tipo, extensao: extensaoDe(file) },
        );
        await uploadArquivo(uploadUrl, file);
        await api.post(`/cultos/${cultoId}/midia`, { mediaId, s3Key, tipo, ordem });
        ordem += 1;
      }
      await carregarMidiaDoExpandido(cultoId);
      carregar();
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removerMidia = async (cultoId: string, mediaId: string) => {
    if (!confirm('Remover este arquivo de mídia?')) return;
    await api.del(`/cultos/${cultoId}/midia/${mediaId}`);
    setMidia((m) => m.filter((x) => x.mediaId !== mediaId));
    carregar();
  };

  const removerCulto = async (culto: Culto) => {
    if (!confirm(`Excluir o culto "${culto.titulo}"? Isso apaga também todas as ${culto.fotos + culto.videos} mídias publicadas. Essa ação não pode ser desfeita.`)) return;
    await api.del(`/cultos/${culto.cultoId}`);
    if (expandido === culto.cultoId) setExpandido(null);
    carregar();
  };

  return (
    <div>
      <div className="flex justify-between items-center gap-2.5 flex-wrap mb-4">
        <span className="text-[12.5px] text-muted">{cultos.length} cultos publicados</span>
        <Button size="sm" variant="gold" onClick={() => setMostrarForm((v) => !v)}>
          <IconPlus className="icon w-3.5 h-3.5" /> Novo culto
        </Button>
      </div>

      {mostrarForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={criarCulto} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2.5 items-end">
            <Field label="Data do culto">
              <input type="date" required className={inputCls} value={novoCulto.data} onChange={(e) => setNovoCulto((c) => ({ ...c, data: e.target.value }))} />
            </Field>
            <Field label="Título">
              <input required className={inputCls} value={novoCulto.titulo} onChange={(e) => setNovoCulto((c) => ({ ...c, titulo: e.target.value }))} placeholder="Ex: Culto da Família" />
            </Field>
            <Button type="submit" variant="secondary" className="justify-center">Criar</Button>
          </form>
        </Card>
      )}

      <div className="flex flex-col gap-3.5">
        {cultos.map((c) => (
          <Card key={c.cultoId} className="overflow-hidden">
            <div className="flex items-center gap-3.5 p-3.5">
              <div className="w-16 h-16 rounded-lg bg-surface2 border border-border flex-none overflow-hidden flex items-center justify-center">
                {c.capaUrl ? (
                  c.capaTipo === 'video' ? (
                    <video src={c.capaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                  ) : (
                    <img src={c.capaUrl} alt="" className="w-full h-full object-cover" />
                  )
                ) : (
                  <IconImage className="icon w-5 h-5 text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] text-ink truncate">{c.titulo}</h3>
                <p className="text-xs text-muted flex items-center gap-2.5">
                  <span>{c.data.split('-').reverse().join('/')}</span>
                  <span className="flex items-center gap-1"><IconCamera className="icon w-3 h-3" />{c.fotos}</span>
                  <span className="flex items-center gap-1"><IconVideo className="icon w-3 h-3" />{c.videos}</span>
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => abrirCulto(c.cultoId)}>
                {expandido === c.cultoId ? 'Fechar' : 'Gerenciar'}
              </Button>
              <button
                onClick={() => removerCulto(c)}
                className="w-9 h-9 rounded-lg border border-border flex-none flex items-center justify-center text-inkSecondary hover:bg-expense hover:text-white hover:border-expense"
                title="Excluir culto"
              >
                <IconTrash className="icon w-4 h-4" />
              </button>
            </div>

            {expandido === c.cultoId && (
              <div className="border-t border-border p-3.5">
                <label className="flex flex-col items-center gap-2 border border-dashed border-border rounded-xl bg-surface2 text-muted text-[13px] py-6 cursor-pointer mb-3.5">
                  <IconVideo className="icon w-5 h-5 text-accentStrong" />
                  {enviando ? 'Enviando...' : 'Clique para enviar fotos ou vídeos para este culto'}
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    hidden
                    onChange={(e) => enviarMidia(c.cultoId, e.target.files)}
                    disabled={enviando}
                  />
                </label>

                {carregandoMidia ? (
                  <p className="text-sm text-muted text-center py-6">Carregando...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {midia.map((m, i) => (
                      <div key={m.mediaId} className="relative aspect-square rounded-xl bg-surface2 border border-border overflow-hidden">
                        <button onClick={() => setLightboxIndex(i)} className="absolute inset-0 w-full h-full" title="Ver em tamanho maior">
                          {m.tipo === 'video' ? (
                            <video src={m.url} className="w-full h-full object-cover" muted preload="metadata" />
                          ) : (
                            <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          )}
                        </button>
                        <button
                          onClick={() => removerMidia(c.cultoId, m.mediaId)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface/90 border border-border flex items-center justify-center text-inkSecondary hover:bg-expense hover:text-white hover:border-expense"
                          title="Remover"
                        >
                          <IconTrash className="icon w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {midia.length === 0 && (
                      <p className="col-span-full text-sm text-muted text-center py-4">Nenhuma mídia publicada para este culto ainda.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
        {!carregando && cultos.length === 0 && (
          <p className="text-sm text-muted text-center py-10">Nenhum culto criado ainda. Clique em "Novo culto" para começar.</p>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox itens={midia} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      )}
    </div>
  );
}
