import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Button, Field, inputCls } from './ui';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { IconTrash } from './icons';

function extensaoDe(file: File) {
  const partes = file.name.split('.');
  return partes.length > 1 ? partes.pop()! : 'bin';
}

export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  perigo,
  onCancelar,
  onConfirmar,
}: {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  perigo?: boolean;
  onCancelar: () => void;
  onConfirmar: (motivo: string, anexoKey?: string) => void | Promise<void>;
}) {
  const [motivo, setMotivo] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) {
      setMotivo('');
      setArquivo(null);
      setEnviando(false);
      setErro('');
    }
  }, [aberto]);

  const confirmar = async () => {
    if (!motivo.trim()) return;
    setErro('');
    setEnviando(true);
    try {
      let anexoKey: string | undefined;
      if (arquivo) {
        const { anexoKey: key, uploadUrl } = await api.post<{ anexoKey: string; uploadUrl: string }>(
          '/auditoria/anexo/presign',
          { contentType: arquivo.type || 'application/octet-stream', extensao: extensaoDe(arquivo) },
        );
        await fetch(uploadUrl, { method: 'PUT', body: arquivo, headers: { 'Content-Type': arquivo.type || 'application/octet-stream' } });
        anexoKey = key;
      }
      await onConfirmar(motivo.trim(), anexoKey);
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível concluir. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) onCancelar(); }}>
      <DialogContent>
        <DialogTitle className="font-serif text-lg text-ink">{titulo}</DialogTitle>
        <DialogDescription className="text-[13px] text-inkSecondary">{mensagem}</DialogDescription>
        <div className="flex flex-col gap-3">
          <Field label="Motivo (obrigatório)" hint="Fica registrado na auditoria.">
            <textarea
              autoFocus
              rows={2}
              className={inputCls}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explique o motivo desta ação"
            />
          </Field>
          <Field label="Anexo (opcional)" hint="Um comprovante ou documento relacionado ao motivo.">
            {arquivo ? (
              <div className="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-2.5">
                <span className="text-[12.5px] text-ink truncate flex-1 min-w-0">{arquivo.name}</span>
                <button type="button" onClick={() => setArquivo(null)} className="flex-none text-inkSecondary hover:text-expense" title="Remover anexo">
                  <IconTrash className="icon w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <input
                ref={inputRef}
                type="file"
                className={inputCls}
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            )}
          </Field>
        </div>
        {erro && <p className="text-danger text-xs">{erro}</p>}
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" onClick={onCancelar} className="justify-center flex-1">
            Cancelar
          </Button>
          <Button
            type="button"
            variant={perigo ? 'danger' : 'info'}
            disabled={!motivo.trim() || enviando}
            onClick={confirmar}
            className="justify-center flex-1"
          >
            {enviando ? 'Enviando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
