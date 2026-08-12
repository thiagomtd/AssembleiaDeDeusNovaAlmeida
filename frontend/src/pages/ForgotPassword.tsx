import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { Card, Button, Field, inputCls, Eyebrow, PasswordField } from '../components/ui';
import { Emblem, IconLock, IconCheck, IconChevronLeft } from '../components/icons';
import { normalizePhoneBR } from '../lib/phone';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const enviarCodigo = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const telefoneNormalizado = normalizePhoneBR(telefone);
      setTelefone(telefoneNormalizado);
      await resetPassword({ username: telefoneNormalizado });
      setPasso(2);
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível enviar o código.');
    } finally {
      setCarregando(false);
    }
  };

  const redefinir = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não conferem.');
      return;
    }
    setCarregando(true);
    try {
      await confirmResetPassword({ username: telefone, confirmationCode: codigo, newPassword: novaSenha });
      setPasso(3);
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível redefinir a senha. Confira o código.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="max-w-[380px] mx-auto mt-6">
      <Emblem className="w-[52px] h-[52px] mx-auto mb-4.5" />
      <Card className="px-6 py-6">
        <Link to="/entrar" className="inline-flex items-center gap-1 text-[12.5px] text-inkSecondary mb-4">
          <IconChevronLeft className="icon w-[13px] h-[13px]" /> Voltar para o login
        </Link>
        <Eyebrow icon={<IconLock className="icon w-3 h-3" />}>Recuperar acesso</Eyebrow>
        <h2 className="text-[19px] mb-4 text-ink">Esqueci minha senha</h2>

        {passo === 1 && (
          <form onSubmit={enviarCodigo} className="flex flex-col gap-3.5">
            <p className="text-xs text-muted leading-relaxed">
              Informe o celular da sua conta. Enviaremos um código de verificação por SMS para redefinir sua senha.
            </p>
            <Field label="Celular">
              <input
                type="tel"
                required
                className={inputCls}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(27) 99911-2233"
              />
            </Field>
            {erro && <p className="text-expense text-xs">{erro}</p>}
            <Button type="submit" variant="info" disabled={carregando} className="w-full justify-center">
              {carregando ? 'Enviando...' : 'Enviar código'}
            </Button>
          </form>
        )}

        {passo === 2 && (
          <form onSubmit={redefinir} className="flex flex-col gap-3.5">
            <p className="text-xs text-muted leading-relaxed">
              Enviamos um código por SMS para o seu celular. Informe-o abaixo junto com a nova senha.
            </p>
            <Field label="Código de verificação">
              <input
                required
                className={inputCls}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="000000"
              />
            </Field>
            <PasswordField
              label="Nova senha"
              required
              minLength={8}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="mínimo 8 caracteres"
            />
            <PasswordField
              label="Confirmar nova senha"
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="repita a nova senha"
            />
            {erro && <p className="text-expense text-xs">{erro}</p>}
            <Button type="submit" variant="info" disabled={carregando} className="w-full justify-center">
              {carregando ? 'Salvando...' : 'Redefinir senha'}
            </Button>
          </form>
        )}

        {passo === 3 && (
          <div className="flex flex-col gap-3.5 text-center">
            <IconCheck className="icon w-8 h-8 mx-auto text-income" />
            <p className="font-semibold text-ink">Senha redefinida com sucesso.</p>
            <Button variant="info" className="w-full justify-center" onClick={() => navigate('/entrar')}>
              Voltar para o login
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
