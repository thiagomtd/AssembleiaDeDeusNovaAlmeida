import {
  BarChart as RBarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer,
} from 'recharts';
import { fmtBRL } from './ui';

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const axisTick = { fontSize: 12, fill: '#96958a' };
const tooltipStyle = { fontSize: 13, borderRadius: 8, border: '1px solid #e4e1d5' };

function formatNum(v: number) {
  return Math.round(v).toLocaleString('pt-BR');
}
const numTick = (v: unknown) => formatNum(Number(v));
const brlTooltip = (v: unknown) => fmtBRL(Number(v));

export function BarChart({ porMes }: { porMes: Record<string, { ent: number; sai: number }> }) {
  const meses = Object.keys(porMes).sort();
  if (meses.length === 0) return <p className="text-sm text-muted py-10 text-center">Sem dados neste ano.</p>;
  const data = meses.map((m) => ({ mes: MESES_ABREV[Number(m) - 1], ent: porMes[m].ent, sai: porMes[m].sai }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RBarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e1d5" vertical={false} />
        <XAxis dataKey="mes" tick={axisTick} axisLine={{ stroke: '#e4e1d5' }} tickLine={false} />
        <YAxis tickFormatter={numTick} tick={axisTick} axisLine={false} tickLine={false} width={52} />
        <Tooltip formatter={brlTooltip} contentStyle={tooltipStyle} />
        <Bar dataKey="ent" name="Entradas" fill="#4f7a56" radius={[3, 3, 0, 0]}>
          <LabelList dataKey="ent" formatter={numTick} position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#4f7a56' }} />
        </Bar>
        <Bar dataKey="sai" name="Saídas" fill="#a1543c" radius={[3, 3, 0, 0]}>
          <LabelList dataKey="sai" formatter={numTick} position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#a1543c' }} />
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}

export function TrendSparkline({ porMes }: { porMes: Record<string, { ent: number; sai: number }> }) {
  const meses = Object.keys(porMes).sort().slice(-6);
  if (meses.length < 2) return <p className="text-sm text-muted py-6 text-center">Dados insuficientes para a tendência.</p>;
  const data = meses.map((m) => ({ mes: MESES_ABREV[Number(m) - 1], saldo: porMes[m].ent - porMes[m].sai }));

  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 22, right: 16, left: 16, bottom: 0 }}>
        <XAxis dataKey="mes" tick={axisTick} axisLine={false} tickLine={false} />
        <Tooltip formatter={brlTooltip} contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="saldo" stroke="#a4762e" strokeWidth={2} dot={{ r: 3, fill: '#fff', stroke: '#a4762e', strokeWidth: 1.5 }} activeDot={{ r: 4.5 }}>
          <LabelList dataKey="saldo" formatter={numTick} position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#a4762e' }} />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ dados }: { dados: Record<string, number> }) {
  const entries = Object.entries(dados).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <p className="text-sm text-muted">Sem lançamentos.</p>;
  const max = Math.max(...entries.map(([, v]) => v));
  return (
    <div className="flex flex-col gap-2.5">
      {entries.map(([nome, valor]) => (
        <div key={nome} className="grid grid-cols-[110px_1fr_74px] items-center gap-2.5 text-[12.5px]">
          <span className="text-ink">{nome}</span>
          <div className="bg-surface2 rounded-md h-[11px] overflow-hidden">
            <div className="h-full bg-accent rounded-md" style={{ width: `${(valor / max) * 100}%` }} />
          </div>
          <span className="text-right text-inkSecondary">{fmtBRL(valor)}</span>
        </div>
      ))}
    </div>
  );
}
