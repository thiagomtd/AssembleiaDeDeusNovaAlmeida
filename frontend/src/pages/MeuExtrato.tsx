import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, Eyebrow, Button, PrivacyNote, fmtBRL } from '../components/ui';
import { IconWallet, IconLock } from '../components/icons';

type Contribuicao = { data: string; categoria: string; valor: number; descricao: string };

export function MeuExtrato() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [nome, setNome] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [lista, setLista] = useState<Contribuicao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    api
      .get<{ nome: string | null; total: number; contribuicoes: Contribuicao[] }>(`/me/contribuicoes?ano=${ano}`)
      .then((r) => {
        setNome(r.nome);
        setTotal(r.total);
        setLista(r.contribuicoes);
      })
      .catch(() => {
        setNome(null);
        setTotal(0);
        setLista([]);
      })
      .finally(() => setCarregando(false));
  }, [ano]);

  const anos = Array.from({ length: 6 }, (_, i) => anoAtual - i);

  return (
    <section className="print:max-w-none">
      <div className="print:hidden">
        <Eyebrow icon={<IconWallet className="icon w-3 h-3" />}>Portal do Membro</Eyebrow>
        <h1 className="text-[32px] mb-1.5 text-ink">Meu Extrato</h1>
        <p className="text-inkSecondary text-[14.5px] max-w-[62ch] mb-6">
          Suas contribuições registradas pela tesouraria, para conferência pessoal e para declaração de imposto de
          renda.
        </p>
      </div>

      <Card className="p-3.5 flex items-center justify-between gap-2.5 flex-wrap mb-5 print:hidden">
        <select
          className="min-w-0 max-w-full bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-[13px] text-ink"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
        >
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <Button variant="secondary" size="sm" onClick={() => window.print()} disabled={lista.length === 0}>
          Imprimir / Salvar PDF
        </Button>
      </Card>

      <div className="hidden print:block mb-6">
        <h1 className="text-xl font-serif">Extrato de contribuições — {ano}</h1>
        <p className="text-sm text-muted">Assembleia de Deus de Nova Almeida</p>
        {nome && <p className="text-sm mt-1">{nome}</p>}
      </div>

      <Card className="p-4 mb-5 print:border-none print:shadow-none print:p-0">
        <Eyebrow>Total contribuído em {ano}</Eyebrow>
        <div className="font-serif text-2xl text-income">{fmtBRL(total)}</div>
      </Card>

      <Card className="overflow-hidden mb-5 print:border-none print:shadow-none">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="px-3.5 py-2.5 font-semibold">Data</th>
              <th className="px-3.5 py-2.5 font-semibold">Categoria</th>
              <th className="px-3.5 py-2.5 font-semibold text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-3.5 py-2.5 text-inkSecondary">
                  {new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                </td>
                <td className="px-3.5 py-2.5 text-ink">{c.categoria}</td>
                <td className="px-3.5 py-2.5 text-right font-semibold text-income">{fmtBRL(c.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!carregando && lista.length === 0 && (
          <p className="text-sm text-muted py-8 text-center">
            {nome === null
              ? 'Seu cadastro ainda não tem contribuições vinculadas a você.'
              : `Nenhuma contribuição registrada em ${ano}.`}
          </p>
        )}
      </Card>

      <div className="print:hidden">
        <PrivacyNote icon={<IconLock className="icon w-[17px] h-[17px] text-muted mt-0.5" />}>
          Este extrato mostra só as suas próprias contribuições. Ninguém além de você e da administração tem acesso a
          ele.
        </PrivacyNote>
      </div>
    </section>
  );
}
