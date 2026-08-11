import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, Button, Field, inputCls, PrivacyNote } from '../../components/ui';
import { IconLock, IconPlus } from '../../components/icons';

export function NovoMembro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '', telefone: '', dataNascimento: '', dataAssociacao: '', grupo: 'member',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api.post('/members', form);
      navigate('/admin/membros');
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível criar o membro.');
    } finally {
      setSalvando(false);
    }
  };

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
            hint="Membro: leitura. Mídia: + gerencia cultos/fotos/vídeos. Tesouraria: + gerencia lançamentos financeiros. Administração: acesso total."
          >
            <select className={inputCls} value={form.grupo} onChange={set('grupo')}>
              <option value="member">Membro</option>
              <option value="midia">Mídia</option>
              <option value="tesouraria">Tesouraria</option>
              <option value="admin">Administração (diretoria)</option>
            </select>
          </Field>
        </div>
        <div className="px-4.5 pb-4.5 flex flex-col gap-3.5">
          <PrivacyNote icon={<IconLock className="icon w-[17px] h-[17px] text-muted mt-0.5" />}>
            Ao salvar, uma conta é criada automaticamente no Cognito e um SMS com{' '}
            <strong className="text-ink">login e senha temporária</strong> é enviado para o celular da pessoa. No
            primeiro acesso, ela será obrigada a definir uma nova senha.
          </PrivacyNote>
          {erro && <p className="text-expense text-xs">{erro}</p>}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button type="submit" variant="gold" disabled={salvando} className="justify-center">
              <IconPlus className="icon w-3.5 h-3.5" /> {salvando ? 'Criando...' : 'Criar membro e enviar acesso'}
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
