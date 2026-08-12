import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Button, Field, inputCls } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconChevronLeft } from '../../components/icons';

interface Membro {
  memberId: string;
  nome: string;
  telefone: string;
  dataNascimento: string;
  dataAssociacao: string;
  grupo: 'admin' | 'member' | 'midia' | 'tesouraria';
  status: 'ativo' | 'inativo';
}

export function EditarMembro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const membroDoState = (location.state as { membro?: Membro } | null)?.membro;

  const [membro, setMembro] = useState<Membro | null>(membroDoState ?? null);
  const [carregando, setCarregando] = useState(!membroDoState);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (membroDoState) return;
    api
      .get<Membro[]>('/members')
      .then((lista) => setMembro(lista.find((m) => m.memberId === id) ?? null))
      .finally(() => setCarregando(false));
  }, [id, membroDoState]);

  const validarEAbrirConfirmacao = (e: FormEvent) => {
    e.preventDefault();
    if (!membro) return;
    setErro('');
    setConfirmando(true);
  };

  const salvar = async (motivo: string, anexoKey?: string) => {
    if (!membro) return;
    try {
      await api.put(`/members/${membro.memberId}`, {
        nome: membro.nome,
        dataNascimento: membro.dataNascimento,
        dataAssociacao: membro.dataAssociacao,
        status: membro.status,
        grupo: membro.grupo,
        motivo,
        anexoKey,
      });
      navigate('/admin/membros');
    } catch (err: any) {
      setConfirmando(false);
      setErro(err?.message || 'Não foi possível salvar as alterações.');
    }
  };

  if (carregando) return <p className="text-sm text-muted text-center py-10">Carregando...</p>;
  if (!membro) return <p className="text-sm text-muted text-center py-10">Membro não encontrado.</p>;

  return (
    <div>
      <button
        onClick={() => navigate('/admin/membros')}
        className="inline-flex items-center gap-1 text-[12.5px] text-inkSecondary mb-4"
      >
        <IconChevronLeft className="icon w-[13px] h-[13px]" /> Voltar para Membros
      </button>

      <Card>
        <form onSubmit={validarEAbrirConfirmacao}>
          <div className="grid sm:grid-cols-2 gap-3.5 p-4.5">
            <Field label="Nome completo">
              <input
                required
                className={inputCls}
                value={membro.nome}
                onChange={(e) => setMembro({ ...membro, nome: e.target.value })}
              />
            </Field>
            <Field label="Celular (login)" hint="Não pode ser alterado por aqui.">
              <input className={`${inputCls} opacity-60`} value={membro.telefone} disabled />
            </Field>
            <Field label="Data de nascimento">
              <input
                type="date"
                className={inputCls}
                value={membro.dataNascimento}
                onChange={(e) => setMembro({ ...membro, dataNascimento: e.target.value })}
              />
            </Field>
            <Field label="Data de associação">
              <input
                type="date"
                className={inputCls}
                value={membro.dataAssociacao}
                onChange={(e) => setMembro({ ...membro, dataAssociacao: e.target.value })}
              />
            </Field>
            <Field
              label="Grupo de acesso"
              hint="Membro: leitura. Mídia: + gerencia cultos/fotos/vídeos. Tesouraria: + gerencia lançamentos financeiros. Administração: acesso total."
            >
              <select
                className={inputCls}
                value={membro.grupo}
                onChange={(e) => setMembro({ ...membro, grupo: e.target.value as Membro['grupo'] })}
              >
                <option value="member">Membro</option>
                <option value="midia">Mídia</option>
                <option value="tesouraria">Tesouraria</option>
                <option value="admin">Administração (diretoria)</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputCls}
                value={membro.status}
                onChange={(e) => setMembro({ ...membro, status: e.target.value as Membro['status'] })}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo (bloqueia o login)</option>
              </select>
            </Field>
          </div>
          <div className="px-4.5 pb-4.5 flex flex-col gap-3.5">
            {erro && <p className="text-expense text-xs">{erro}</p>}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button type="submit" variant="info" className="justify-center">
                Salvar alterações
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/membros')} className="justify-center">
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        aberto={confirmando}
        titulo="Confirmar alteração"
        mensagem={`Você está prestes a salvar alterações no cadastro de ${membro.nome}.`}
        onCancelar={() => setConfirmando(false)}
        onConfirmar={salvar}
      />
    </div>
  );
}
