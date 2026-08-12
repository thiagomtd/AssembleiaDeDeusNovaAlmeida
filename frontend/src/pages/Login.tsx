import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Field, inputCls, Eyebrow, PasswordField } from '../components/ui';
import { Emblem, IconShield } from '../components/icons';
import { normalizePhoneBR } from '../lib/phone';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { from?: Location })?.from
    ? (location.state as { from: Location }).from.pathname + (location.state as { from: Location }).from.search
    : '/';
  const { refresh } = useAuth();
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [precisaNovaSenha, setPrecisaNovaSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await signIn({ username: normalizePhoneBR(telefone), password: senha });
      if (res.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setPrecisaNovaSenha(true);
      } else if (res.isSignedIn) {
        await refresh();
        navigate(destino, { replace: true });
      }
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível entrar. Confira o celular e a senha.');
    } finally {
      setCarregando(false);
    }
  };

  const definirNovaSenha = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await confirmSignIn({ challengeResponse: novaSenha });
      if (res.isSignedIn) {
        await refresh();
        navigate(destino, { replace: true });
      }
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível definir a nova senha.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="max-w-[380px] mx-auto mt-6">
      <Emblem className="w-[52px] h-[52px] mx-auto mb-4.5" />
      <Card className="px-6 py-6">
        {!precisaNovaSenha ? (
          <>
            <Eyebrow icon={<IconShield className="icon w-3 h-3" />}>Acesso</Eyebrow>
            <h2 className="text-[19px] mb-4 text-ink">Entrar</h2>
            <form onSubmit={entrar} className="flex flex-col gap-3.5">
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
              <PasswordField
                label="Senha"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
              />
              <div className="text-right -mt-2">
                <Link to="/recuperar-senha" className="text-accentStrong text-xs font-semibold">
                  Esqueci minha senha
                </Link>
              </div>
              {erro && <p className="text-expense text-xs">{erro}</p>}
              <Button type="submit" variant="gold" disabled={carregando} className="w-full justify-center">
                {carregando ? 'Entrando...' : 'Entrar'}
              </Button>
              <p className="text-[12px] text-muted leading-relaxed">
                O acesso é feito com o celular cadastrado pela administração da igreja. Membros e administradores
                entram pela mesma tela.
              </p>
            </form>
          </>
        ) : (
          <>
            <Eyebrow icon={<IconShield className="icon w-3 h-3" />}>Primeiro acesso</Eyebrow>
            <h2 className="text-[19px] mb-4 text-ink">Defina sua nova senha</h2>
            <form onSubmit={definirNovaSenha} className="flex flex-col gap-3.5">
              <PasswordField
                label="Nova senha"
                hint="Mínimo de 8 caracteres, com letra maiúscula, minúscula e número."
                required
                minLength={8}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="mínimo 8 caracteres"
              />
              {erro && <p className="text-expense text-xs">{erro}</p>}
              <Button type="submit" variant="gold" disabled={carregando} className="w-full justify-center">
                {carregando ? 'Salvando...' : 'Salvar e entrar'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
