import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Card, Eyebrow, Button, FilterSelect, fmtBRL } from '../components/ui';
import { IconWallet } from '../components/icons';

type Contribuicao = { data: string; categoria: string; valor: number; descricao: string; pessoa: string };

export function MeuExtrato() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [nome, setNome] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [lista, setLista] = useState<Contribuicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroPessoa, setFiltroPessoa] = useState('');

  useEffect(() => {
    setCarregando(true);
    setFiltroPessoa('');
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
  // Só mostra a coluna/filtro de "Pessoa" quando há contribuição de mais de uma pessoa
  // (ex: um dependente) — pra quem não tem dependente a tela fica exatamente como já era.
  const mostrarPessoa = new Set(lista.map((c) => c.pessoa)).size > 1;

  const totaisPorPessoa = useMemo(() => {
    const porPessoa = new Map<string, number>();
    for (const c of lista) porPessoa.set(c.pessoa, (porPessoa.get(c.pessoa) ?? 0) + c.valor);
    return Array.from(porPessoa.entries())
      .map(([pessoa, valor]) => ({ pessoa, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [lista]);

  const listaFiltrada = filtroPessoa ? lista.filter((c) => c.pessoa === filtroPessoa) : lista;

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

      <div className={`grid gap-3.5 mb-5 ${mostrarPessoa ? 'sm:grid-cols-[1fr_auto]' : ''}`}>
        <Card className="p-4 print:border-none print:shadow-none print:p-0">
          <Eyebrow>Total contribuído em {ano}</Eyebrow>
          <div className="font-serif text-2xl text-income">{fmtBRL(total)}</div>
        </Card>

        {mostrarPessoa && (
          <Card className="p-4 print:border-none print:shadow-none print:p-0">
            <Eyebrow>Total por pessoa</Eyebrow>
            <dl className="flex flex-col gap-1 mt-1">
              {totaisPorPessoa.map((p) => (
                <div key={p.pessoa} className="flex items-center justify-between gap-4 text-[13px]">
                  <dt className="text-inkSecondary">{p.pessoa}</dt>
                  <dd className="font-semibold text-income whitespace-nowrap">{fmtBRL(p.valor)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>

      {mostrarPessoa && (
        <div className="flex items-center gap-2.5 mb-3.5 print:hidden">
          <FilterSelect
            value={filtroPessoa}
            onChange={setFiltroPessoa}
            options={totaisPorPessoa.map((p) => ({ value: p.pessoa, label: p.pessoa }))}
            allLabel="Todas as pessoas"
          />
        </div>
      )}

      <Card className="overflow-hidden mb-5 print:border-none print:shadow-none">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="px-3.5 py-2.5 font-semibold">Data</th>
              {mostrarPessoa && <th className="px-3.5 py-2.5 font-semibold">Pessoa</th>}
              <th className="px-3.5 py-2.5 font-semibold">Categoria</th>
              <th className="px-3.5 py-2.5 font-semibold text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {listaFiltrada.map((c, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-3.5 py-2.5 text-inkSecondary">
                  {new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                </td>
                {mostrarPessoa && <td className="px-3.5 py-2.5 text-inkSecondary">{c.pessoa}</td>}
                <td className="px-3.5 py-2.5 text-ink">{c.categoria}</td>
                <td className="px-3.5 py-2.5 text-right font-semibold text-income">{fmtBRL(c.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!carregando && listaFiltrada.length === 0 && (
          <p className="text-sm text-muted py-8 text-center">
            {nome === null
              ? 'Seu cadastro ainda não tem contribuições vinculadas a você.'
              : lista.length > 0
                ? 'Nenhuma contribuição encontrada para essa pessoa.'
                : `Nenhuma contribuição registrada em ${ano}.`}
          </p>
        )}
      </Card>
    </section>
  );
}
