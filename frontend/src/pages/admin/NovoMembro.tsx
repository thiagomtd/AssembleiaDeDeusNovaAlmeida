import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Field, inputCls } from '../../components/ui';
import { IconPlus, IconCheck } from '../../components/icons';

export function NovoMembro() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    nome: '', telefone: '', dataNascimento: '', dataAssociacao: '', grupo: 'member',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [membroCriado, setMembroCriado] = useState<{ nome: string; senhaTemporaria: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const { senhaTemporaria } = await api.post<{ senhaTemporaria: string }>('/members', form);
      setMembroCriado({ nome: form.nome, senhaTemporaria });
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível criar o membro.');
    } finally {
      setSalvando(false);
    }
  };

  const copiarSenha = async () => {
    if (!membroCriado) return;
    try {
      await navigator.clipboard.writeText(membroCriado.senhaTemporaria);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  if (membroCriado) {
    return (
      <Card className="p-4.5 flex flex-col gap-3.5">
        <div>
          <p className="text-[13.5px] font-semibold text-ink">Membro criado: {membroCriado.nome}</p>
          <p className="text-[12.5px] text-inkSecondary">
            O envio por SMS está indisponível — copie a senha temporária abaixo e repasse pra pessoa por fora do
            sistema. No primeiro login, ela será obrigada a trocar por uma senha definitiva.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-2.5">
          <span className="text-[13px] font-mono text-ink flex-1 min-w-0 truncate">{membroCriado.senhaTemporaria}</span>
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
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button type="button" variant="info" onClick={() => navigate('/admin/membros')} className="justify-center">
            Ir para Membros
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setForm({ nome: '', telefone: '', dataNascimento: '', dataAssociacao: '', grupo: 'member' });
              setMembroCriado(null);
              setCopiado(false);
            }}
            className="justify-center"
          >
            Cadastrar outro membro
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={salvar}>
        <div className="grid sm:grid-cols-2 gap-3.5 p-4.5">
          <Field label="Nome completo">
            <input required className={inputCls} value={form.nome} onChange={set('nome')} placeholder="Nome do membro" />
          </Field>
          <Field label="Celular (será o login)" hint="Com DDD. Ex: (27) 99911-2233">
            <input required type="tel" className={inputCls} value={form.telefone} onChange={set('telefone')} placeholder="(27) 99911-2233" />
          </Field>
          <Field label="Data de nascimento">
            <input type="date" className={inputCls} value={form.dataNascimento} onChange={set('dataNascimento')} />
          </Field>
          <Field label="Data de associação">
            <input type="date" className={inputCls} value={form.dataAssociacao} onChange={set('dataAssociacao')} />
          </Field>
          <Field
            label="Grupo de acesso"
            hint={
              isAdmin
                ? 'Membro: leitura. Mídia: + gerencia cultos/fotos/vídeos. Tesouraria: + gerencia lançamentos financeiros. Secretaria: + gerencia membros e informações institucionais. Administração: acesso total.'
                : 'Membro: leitura. Mídia: + gerencia cultos/fotos/vídeos. Grupos administrativos só podem ser atribuídos pela diretoria.'
            }
          >
            <select className={inputCls} value={form.grupo} onChange={set('grupo')}>
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
        </div>
        <div className="px-4.5 pb-4.5 flex flex-col gap-3.5">
          {erro && <p className="text-expense text-xs">{erro}</p>}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button type="submit" variant="success" disabled={salvando} className="justify-center">
              <IconPlus className="icon w-3.5 h-3.5" /> {salvando ? 'Criando...' : 'Criar membro'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/membros')} className="justify-center">
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
