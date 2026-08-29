import { Link } from 'react-router-dom';
import { Card, Button, Eyebrow } from '../components/ui';
import { Emblem, IconLock } from '../components/icons';

export function ForgotPassword() {
  return (
    <div className="max-w-[380px] mx-auto mt-6">
      <Emblem className="w-[52px] h-[52px] mx-auto mb-4.5" />
      <Card className="px-6 py-6">
        <Eyebrow icon={<IconLock className="icon w-3 h-3" />}>Recuperar acesso</Eyebrow>
        <h2 className="text-[19px] mb-4 text-ink">Esqueci minha senha</h2>

        <p className="text-[13.5px] text-inkSecondary leading-relaxed mb-5">
          Estamos com problemas no envio de SMS no momento. Por favor, entre em contato com a administração da
          igreja pessoalmente ou pelos contatos de costume para receber uma nova senha.
        </p>

        <Link to="/entrar">
          <Button variant="secondary" className="w-full justify-center">
            Voltar para o login
          </Button>
        </Link>
      </Card>
    </div>
  );
}
