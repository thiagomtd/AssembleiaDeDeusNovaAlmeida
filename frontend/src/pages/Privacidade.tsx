import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, Eyebrow } from '../components/ui';
import { IconShield } from '../components/icons';
import { useAuth } from '../context/AuthContext';

interface MeusDados {
  nome: string;
  telefone: string;
  dataNascimento: string;
  dataAssociacao: string;
  grupo: string;
  status: string;
}

const GRUPO_LABEL: Record<string, string> = {
  admin: 'Administração (diretoria)',
  tesouraria: 'Tesouraria',
  midia: 'Mídia',
  member: 'Membro',
};

export function Privacidade() {
  const { isAuthenticated } = useAuth();
  const [dados, setDados] = useState<MeusDados | null>(null);
  const [carregando, setCarregando] = useState(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get<MeusDados | null>('/me/dados')
      .then(setDados)
      .catch(() => setDados(null))
      .finally(() => setCarregando(false));
  }, [isAuthenticated]);

  return (
    <section>
      <Eyebrow icon={<IconShield className="icon w-3 h-3" />}>LGPD</Eyebrow>
      <h1 className="text-[27px] mb-1.5 text-ink">Privacidade e Proteção de Dados</h1>
      <p className="text-inkSecondary text-[14.5px] max-w-[62ch] mb-6">
        Como a Assembleia de Deus de Nova Almeida trata os dados pessoais de membros e visitantes no sistema.
      </p>

      {isAuthenticated && (
        <Card className="p-4.5 mb-5">
          <Eyebrow>Meus dados</Eyebrow>
          {carregando && <p className="text-sm text-muted">Carregando...</p>}
          {!carregando && !dados && (
            <p className="text-sm text-muted">Nenhum cadastro de membro vinculado à sua conta ainda.</p>
          )}
          {dados && (
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-[13.5px] mt-2">
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <dt className="text-muted">Nome</dt>
                <dd className="text-ink font-semibold">{dados.nome}</dd>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <dt className="text-muted">Celular (login)</dt>
                <dd className="text-ink font-semibold">{dados.telefone}</dd>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <dt className="text-muted">Data de nascimento</dt>
                <dd className="text-ink font-semibold">{dados.dataNascimento || '—'}</dd>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <dt className="text-muted">Associação</dt>
                <dd className="text-ink font-semibold">{dados.dataAssociacao || '—'}</dd>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <dt className="text-muted">Grupo de acesso</dt>
                <dd className="text-ink font-semibold">{GRUPO_LABEL[dados.grupo] ?? dados.grupo}</dd>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <dt className="text-muted">Status</dt>
                <dd className="text-ink font-semibold">{dados.status === 'ativo' ? 'Ativo' : 'Inativo'}</dd>
              </div>
            </dl>
          )}
        </Card>
      )}

      <Card className="p-4.5 flex flex-col gap-4 text-[13.5px] text-inkSecondary leading-relaxed">
        <div>
          <h2 className="font-serif text-base text-ink mb-1">Quais dados coletamos</h2>
          <p>
            Nome, celular (usado como login) e, opcionalmente, data de nascimento — coletados no momento do cadastro
            feito pela administração. Para quem contribui financeiramente, o valor e a data de cada contribuição
            também ficam registrados, vinculados ao cadastro apenas para controle interno da tesouraria.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-base text-ink mb-1">Como protegemos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>O valor de cada contribuição individual nunca é exibido publicamente — só o total agregado.</li>
            <li>A lista de "Dizimistas do Mês" mostra apenas nomes, nunca valores.</li>
            <li>A lista de "Aniversariantes" mostra apenas o dia, nunca o ano de nascimento.</li>
            <li>Fotos e vídeos dos cultos só podem ser vistos por pessoas autenticadas, nunca baixados publicamente.</li>
            <li>Toda ação administrativa (criar, editar ou remover um cadastro ou lançamento) fica registrada em uma trilha de auditoria interna.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-base text-ink mb-1">Seus direitos</h2>
          <p>
            Você pode solicitar a qualquer momento a correção ou remoção dos seus dados falando diretamente com a
            administração da igreja. Ao remover um cadastro, a conta de acesso ao sistema também é removida.
          </p>
        </div>
      </Card>
    </section>
  );
}
