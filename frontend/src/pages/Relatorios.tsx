import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Card, Eyebrow, fmtBRL } from '../components/ui';
import { IconShield, IconDownload } from '../components/icons';
import { MonthPicker } from '../components/MonthPicker';
import { BarChart, TrendSparkline, CategoryBars } from '../components/BarChart';

interface AnualResp {
  porMes: Record<string, { ent: number; sai: number }>;
  porCategoriaEntrada: Record<string, number>;
  porCategoriaSaida: Record<string, number>;
}
interface Transacao {
  tipo: 'entrada' | 'saida';
  valor: number;
  categoria: string;
}

export function Relatorios() {
  const now = new Date();
  const [visao, setVisao] = useState<'anual' | 'mensal'>('anual');
  const [ano, setAno] = useState(now.getFullYear());
  const [dadosAno, setDadosAno] = useState<AnualResp | null>(null);
  const [saldoCaixa, setSaldoCaixa] = useState<number | null>(null);

  const [mes, setMes] = useState(now.getMonth() + 1);
  const [mesAnoSel, setMesAnoSel] = useState(now.getFullYear());
  const [itensMes, setItensMes] = useState<Transacao[]>([]);
  const [dizimistasMes, setDizimistasMes] = useState(0);

  useEffect(() => {
    api.get<AnualResp>(`/transactions/annual?ano=${ano}`).then(setDadosAno).catch(() => setDadosAno(null));
  }, [ano]);

  useEffect(() => {
    api.get<{ saldoCaixa: number }>('/church-info').then((r) => setSaldoCaixa(r.saldoCaixa ?? 0)).catch(() => {});
  }, []);

  const mesAno = `${mesAnoSel}-${String(mes).padStart(2, '0')}`;
  useEffect(() => {
    api.get<Transacao[]>(`/transactions?mes=${mesAno}`).then(setItensMes).catch(() => setItensMes([]));
    api
      .get<{ quantidade: number }>(`/dizimistas?mes=${mesAno}`)
      .then((r) => setDizimistasMes(r.quantidade))
      .catch(() => setDizimistasMes(0));
  }, [mesAno]);

  const totaisAno = useMemo(() => {
    if (!dadosAno) return { entradas: 0, saidas: 0 };
    const meses = Object.values(dadosAno.porMes);
    return {
      entradas: meses.reduce((s, m) => s + m.ent, 0),
      saidas: meses.reduce((s, m) => s + m.sai, 0),
    };
  }, [dadosAno]);

  const totaisMes = useMemo(() => {
    const entradas = itensMes.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
    const saidas = itensMes.filter((t) => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0);
    const porCatEnt: Record<string, number> = {};
    const porCatSai: Record<string, number> = {};
    for (const t of itensMes) {
      const alvo = t.tipo === 'entrada' ? porCatEnt : porCatSai;
      alvo[t.categoria] = (alvo[t.categoria] ?? 0) + t.valor;
    }
    return { entradas, saidas, porCatEnt, porCatSai };
  }, [itensMes]);

  const mediaMensal = (v: number) => (dadosAno ? v / Math.max(Object.keys(dadosAno.porMes).length, 1) : 0);

  return (
    <section>
      <Eyebrow icon={<IconShield className="icon w-3 h-3" />}>Área de membros</Eyebrow>
      <h1 className="text-[32px] mb-1.5 text-ink">Relatórios Financeiros</h1>
      <p className="text-inkSecondary text-[14.5px] max-w-[62ch] mb-6">
        Visão mensal e anual das finanças da igreja, com detalhamento por categoria — sempre em valores agregados.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
        <Card className="p-4">
          <Eyebrow>Entradas no ano</Eyebrow>
          <div className="font-serif text-[23px] text-income">{fmtBRL(totaisAno.entradas)}</div>
        </Card>
        <Card className="p-4">
          <Eyebrow>Saídas no ano</Eyebrow>
          <div className="font-serif text-[23px] text-expense">{fmtBRL(totaisAno.saidas)}</div>
        </Card>
        <Card className="p-4">
          <Eyebrow>Saldo do ano</Eyebrow>
          <div className="font-serif text-[23px] text-ink">{fmtBRL(totaisAno.entradas - totaisAno.saidas)}</div>
        </Card>
        <Card className="p-4">
          <Eyebrow>Saldo total em caixa</Eyebrow>
          <div className="font-serif text-[23px] text-accentStrong">{saldoCaixa === null ? '—' : fmtBRL(saldoCaixa)}</div>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2.5">
        <span className="text-[12.5px] text-muted">Escolha como visualizar o período</span>
        <div className="inline-flex border border-border rounded-lg p-0.5 gap-0.5 bg-surface2">
          {(['anual', 'mensal'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVisao(v)}
              className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold ${
                visao === v ? 'bg-surface text-ink shadow-card' : 'text-inkSecondary'
              }`}
            >
              {v === 'anual' ? 'Anual' : 'Mensal'}
            </button>
          ))}
        </div>
      </div>

      {visao === 'anual' && dadosAno && (
        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <div className="flex gap-4 text-[12.5px] text-inkSecondary mb-2.5">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-income inline-block" />Entradas</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-expense inline-block" />Saídas</span>
            </div>
            <BarChart porMes={dadosAno.porMes} />
            <p className="text-[11.5px] text-muted mt-2.5">Ano de {ano} · valores em R$</p>
          </Card>

          <Card className="p-5">
            <Eyebrow>Tendência de saldo mensal</Eyebrow>
            <p className="text-[11.5px] text-muted mb-2.5">Últimos meses</p>
            <TrendSparkline porMes={dadosAno.porMes} />
          </Card>

          <Card className="p-5">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[11.5px] uppercase tracking-wider text-muted font-bold mb-3">Entradas por categoria</h4>
                <CategoryBars dados={dadosAno.porCategoriaEntrada} />
              </div>
              <div>
                <h4 className="text-[11.5px] uppercase tracking-wider text-muted font-bold mb-3">Saídas por categoria</h4>
                <CategoryBars dados={dadosAno.porCategoriaSaida} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <Eyebrow>Outros indicadores</Eyebrow>
            <table className="w-full text-[13.5px]">
              <tbody>
                <tr>
                  <td className="py-2 text-inkSecondary">Saldo total em caixa (atual)</td>
                  <td className="py-2 text-right font-bold text-accentStrong">{saldoCaixa === null ? '—' : fmtBRL(saldoCaixa)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-inkSecondary">Média mensal de entradas</td>
                  <td className="py-2 text-right">{fmtBRL(mediaMensal(totaisAno.entradas))}</td>
                </tr>
                <tr>
                  <td className="py-2 text-inkSecondary">Média mensal de saídas</td>
                  <td className="py-2 text-right">{fmtBRL(mediaMensal(totaisAno.saidas))}</td>
                </tr>
              </tbody>
            </table>
            <button className="mt-3.5 inline-flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-ink">
              <IconDownload className="icon w-3.5 h-3.5" /> Exportar CSV
            </button>
          </Card>
        </div>
      )}

      {visao === 'mensal' && (
        <div className="flex flex-col gap-5">
          <Card className="p-3.5">
            <MonthPicker mes={mes} ano={mesAnoSel} onChange={(m, a) => { setMes(m); setMesAnoSel(a); }} />
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <Card className="p-4">
              <Eyebrow>Entradas no mês</Eyebrow>
              <div className="font-serif text-[23px] text-income">{fmtBRL(totaisMes.entradas)}</div>
            </Card>
            <Card className="p-4">
              <Eyebrow>Saídas no mês</Eyebrow>
              <div className="font-serif text-[23px] text-expense">{fmtBRL(totaisMes.saidas)}</div>
            </Card>
            <Card className="p-4">
              <Eyebrow>Saldo do mês</Eyebrow>
              <div className="font-serif text-[23px] text-ink">{fmtBRL(totaisMes.entradas - totaisMes.saidas)}</div>
            </Card>
            <Card className="p-4">
              <Eyebrow>Dizimistas no mês</Eyebrow>
              <div className="font-serif text-[23px] text-ink">{dizimistasMes}</div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[11.5px] uppercase tracking-wider text-muted font-bold mb-3">Entradas por categoria</h4>
                <CategoryBars dados={totaisMes.porCatEnt} />
              </div>
              <div>
                <h4 className="text-[11.5px] uppercase tracking-wider text-muted font-bold mb-3">Saídas por categoria</h4>
                <CategoryBars dados={totaisMes.porCatSai} />
              </div>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
