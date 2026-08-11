import { useEffect, useState } from 'react';
import { Card, Button, Field, inputCls } from './ui';

export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  onCancelar,
  onConfirmar,
}: {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  onCancelar: () => void;
  onConfirmar: (motivo: string) => void | Promise<void>;
}) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setMotivo('');
      setEnviando(false);
    }
  }, [aberto]);

  if (!aberto) return null;

  const confirmar = async () => {
    if (!motivo.trim()) return;
    setEnviando(true);
    await onConfirmar(motivo.trim());
    setEnviando(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancelar}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        <Card className="p-4.5">
          <h2 className="font-serif text-lg text-ink mb-1.5">{titulo}</h2>
          <p className="text-[13px] text-inkSecondary mb-3.5">{mensagem}</p>
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
          <div className="flex gap-2.5 mt-3.5">
            <Button type="button" variant="secondary" onClick={onCancelar} className="justify-center flex-1">
              Cancelar
            </Button>
            <Button
              type="button"
              variant="gold"
              disabled={!motivo.trim() || enviando}
              onClick={confirmar}
              className="justify-center flex-1"
            >
              {enviando ? 'Enviando...' : 'Confirmar'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
