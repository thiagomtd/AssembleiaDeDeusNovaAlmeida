import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Field, inputCls } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconChevronLeft, IconLock, IconCheck, IconPlus, IconTrash } from '../../components/icons';

const GRUPOS_ADMINISTRATIVOS = ['admin', 'tesouraria', 'secretario'];

interface Dependente {
  dependenteId?: string;
  nome: string;
  dataNascimento: string;
}

interface Membro {
  memberId: string;
  nome: string;
  telefone: string;
  dataNascimento: string;
  dataAssociacao: string;
  grupo: 'admin' | 'member' | 'midia' | 'tesouraria' | 'secretario';
  status: 'ativo' | 'inativo';
  dependentes?: Dependente[];
}

export function EditarMembro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const membroDoState = (location.state as { membro?: Membro } | null)?.membro;

  const [membro, setMembro] = useState<Membro | null>(membroDoState ?? null);
  const [carregando, setCarregando] = useState(!membroDoState);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [resetandoSenha, setResetandoSenha] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState('');
  const [copiado, setCopiado] = useState(false);

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
        dependentes: (membro.dependentes ?? []).filter((d) => d.nome.trim()),
        motivo,
        anexoKey,
      });
      navigate('/admin/membros');
    } catch (err: any) {
      setConfirmando(false);
      setErro(err?.message || 'Não foi possível salvar as alterações.');
    }
  };

  const resetarSenha = async (motivo: string, anexoKey?: string) => {
    if (!membro) return;
    const { senhaTemporaria } = await api.post<{ senhaTemporaria: string }>(
      `/members/${membro.memberId}/reset-password`,
      { motivo, anexoKey },
    );
    setResetandoSenha(false);
    setSenhaGerada(senhaTemporaria);
    setCopiado(false);
  };

  const copiarSenha = async () => {
    try {
      await navigator.clipboard.writeText(senhaGerada);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  const setDependente = (i: number, campo: keyof Dependente, valor: string) => {
    if (!membro) return;
    const dependentes = [...(membro.dependentes ?? [])];
    dependentes[i] = { ...dependentes[i], [campo]: valor };
    setMembro({ ...membro, dependentes });
  };

  const adicionarDependente = () => {
    if (!membro) return;
    setMembro({ ...membro, dependentes: [...(membro.dependentes ?? []), { nome: '', dataNascimento: '' }] });
  };

  const removerDependente = (i: number) => {
    if (!membro) return;
    setMembro({ ...membro, dependentes: (membro.dependentes ?? []).filter((_, idx) => idx !== i) });
  };

  if (carregando) return <p className="text-sm text-muted text-center py-10">Carregando...</p>;
  if (!membro) return <p className="text-sm text-muted text-center py-10">Membro não encontrado.</p>;

  const alvoAdministrativo = GRUPOS_ADMINISTRATIVOS.includes(membro.grupo);
  const podeEditar = isAdmin || !alvoAdministrativo;

  return (
    <div>
      <button
        onClick={() => navigate('/admin/membros')}
        className="inline-flex items-center gap-1 text-[12.5px] text-inkSecondary mb-4"
      >
        <IconChevronLeft className="icon w-[13px] h-[13px]" /> Voltar para Membros
      </button>

      {!podeEditar ? (
        <Card className="text-center py-14 px-6">
          <IconLock className="icon w-9 h-9 mx-auto mb-3 text-muted" />
          <h2 className="text-xl font-serif mb-2 text-ink">Acesso restrito</h2>
          <p className="text-inkSecondary text-sm mb-1 max-w-[42ch] mx-auto">
            {membro.nome} tem um grupo administrativo. Só a diretoria (Administração) pode editar, resetar senha ou
            remover esse tipo de conta.
          </p>
        </Card>
      ) : (
        <>
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
                  hint={
                    isAdmin
                      ? 'Membro: leitura. Mídia: + gerencia cultos/fotos/vídeos. Tesouraria: + gerencia lançamentos financeiros. Secretaria: + gerencia membros e informações institucionais. Administração: acesso total.'
                      : 'Membro: leitura. Mídia: + gerencia cultos/fotos/vídeos. Grupos administrativos só podem ser atribuídos pela diretoria.'
                  }
                >
                  <select
                    className={inputCls}
                    value={membro.grupo}
                    onChange={(e) => setMembro({ ...membro, grupo: e.target.value as Membro['grupo'] })}
                  >
                    <option value="member">Membro</option>
                    <option value="midia">Mídia</option>
                    {isAdmin && (
                      <>
                        <option value="tesouraria">Tesouraria</option>
                        <option value="secretario">Secretaria</option>
                        <option value="admin">Administração (diretoria)</option>
                      </>
                    )}
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

              <div className="px-4.5 pb-4.5">
                <p className="text-[13.5px] font-semibold text-ink mb-1">Dependentes</p>
                <p className="text-[12.5px] text-inkSecondary mb-3">
                  Pessoas sem celular/login próprio (ex: filho) que dão dízimo em nome próprio — aparecem como opção
                  ao lançar um dízimo, e as contribuições ficam visíveis aqui em "Meu Extrato" de {membro.nome}.
                </p>
                <div className="flex flex-col gap-2.5">
                  {(membro.dependentes ?? []).map((dep, i) => (
                    <div key={dep.dependenteId ?? i} className="flex items-end gap-2.5">
                      <div className="flex-1 min-w-0">
                        <Field label="Nome">
                          <input
                            className={inputCls}
                            value={dep.nome}
                            onChange={(e) => setDependente(i, 'nome', e.target.value)}
                            placeholder="Nome do dependente"
                          />
                        </Field>
                      </div>
                      <div className="w-[150px] flex-none">
                        <Field label="Nascimento">
                          <input
                            type="date"
                            className={inputCls}
                            value={dep.dataNascimento}
                            onChange={(e) => setDependente(i, 'dataNascimento', e.target.value)}
                          />
                        </Field>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerDependente(i)}
                        className="flex-none w-9 h-9 mb-0.5 rounded-lg border border-danger/30 bg-dangerSoft inline-flex items-center justify-center text-danger hover:bg-danger hover:text-white hover:border-danger"
                        title="Remover dependente"
                      >
                        <IconTrash className="icon w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" size="sm" onClick={adicionarDependente} className="self-start">
                    <IconPlus className="icon w-3.5 h-3.5" /> Adicionar dependente
                  </Button>
                </div>
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

          <Card className="mt-4">
            <div className="p-4.5 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div>
                  <p className="text-[13.5px] font-semibold text-ink">Senha de acesso</p>
                  <p className="text-[12.5px] text-inkSecondary">
                    Gera uma senha temporária nova e obriga a pessoa a trocá-la no próximo login. O envio (SMS) está
                    indisponível — copie e repasse a senha por fora do sistema.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setResetandoSenha(true)}
                  className="justify-center flex-none"
                >
                  <IconLock className="icon w-3.5 h-3.5" /> Resetar senha
                </Button>
              </div>
              {senhaGerada && (
                <div className="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-2.5">
                  <span className="text-[13px] font-mono text-ink flex-1 min-w-0 truncate">{senhaGerada}</span>
                  <button
                    type="button"
                    onClick={copiarSenha}
                    className="flex-none text-[12px] font-semibold text-info hover:opacity-80 inline-flex items-center gap-1"
                  >
                    {copiado ? (
                      <>
                        <IconCheck className="icon w-3.5 h-3.5" /> Copiado
                      </>
                    ) : (
                      'Copiar'
                    )}
                  </button>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      <ConfirmDialog
        aberto={resetandoSenha}
        titulo="Resetar senha"
        mensagem={`Uma nova senha temporária será gerada para ${membro.nome}, e o acesso atual (se houver) será encerrado.`}
        onCancelar={() => setResetandoSenha(false)}
        onConfirmar={resetarSenha}
      />

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
