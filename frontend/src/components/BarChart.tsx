import { fmtBRL } from './ui';

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function BarChart({ porMes }: { porMes: Record<string, { ent: number; sai: number }> }) {
  const meses = Object.keys(porMes).sort();
  if (meses.length === 0) return <p className="text-sm text-muted py-10 text-center">Sem dados neste ano.</p>;

  const W = 640, H = 220, padL = 40, padB = 26, padT = 10;
  const chartW = W - padL - 10, chartH = H - padB - padT;
  const maxV = Math.max(...meses.flatMap((m) => [porMes[m].ent, porMes[m].sai])) * 1.15 || 1;
  const groupW = chartW / meses.length;
  const barW = 16, gap = 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[170px] sm:h-[220px] overflow-visible">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padT + chartH * (1 - f);
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={W - 6} y2={y} stroke="#e4e1d5" strokeWidth={1} />
            <text x={padL - 8} y={y + 3} fontSize={9.5} textAnchor="end" fill="#96958a">
              {Math.round((maxV * f) / 1000)}k
            </text>
          </g>
        );
      })}
      {meses.map((m, i) => {
        const gx = padL + i * groupW + groupW / 2;
        const hEnt = chartH * (porMes[m].ent / maxV);
        const hSai = chartH * (porMes[m].sai / maxV);
        const xEnt = gx - barW - gap / 2;
        const xSai = gx + gap / 2;
        const idx = Number(m) - 1;
        return (
          <g key={m}>
            <rect x={xEnt} y={padT + chartH - hEnt} width={barW} height={hEnt} rx={3} fill="#4f7a56">
              <title>{`${MESES_ABREV[idx]}: Entradas ${fmtBRL(porMes[m].ent)}`}</title>
            </rect>
            <rect x={xSai} y={padT + chartH - hSai} width={barW} height={hSai} rx={3} fill="#a1543c">
              <title>{`${MESES_ABREV[idx]}: Saídas ${fmtBRL(porMes[m].sai)}`}</title>
            </rect>
            <text x={gx} y={H - 6} fontSize={10.5} textAnchor="middle" fill="#96958a">
              {MESES_ABREV[idx]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function TrendSparkline({ porMes }: { porMes: Record<string, { ent: number; sai: number }> }) {
  const meses = Object.keys(porMes).sort().slice(-6);
  if (meses.length < 2) return <p className="text-sm text-muted py-6 text-center">Dados insuficientes para a tendência.</p>;

  const data = meses.map((m) => ({ m, saldo: porMes[m].ent - porMes[m].sai }));
  const W = 560, H = 90, padL = 6, padR = 6, padY = 14;
  const min = Math.min(...data.map((d) => d.saldo)) * 0.92;
  const max = Math.max(...data.map((d) => d.saldo)) * 1.08;
  const stepX = (W - padL - padR) / (data.length - 1);
  const yFor = (v: number) => padY + (H - padY * 2) * (1 - (v - min) / (max - min || 1));
  const pts = data.map((d, i) => [padL + i * stepX, yFor(d.saldo)] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1][0]} ${H - padY} L ${pts[0][0]} ${H - padY} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[90px] overflow-visible">
      <path d={area} fill="#f0e6cf" opacity={0.6} />
      <path d={line} fill="none" stroke="#a4762e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const isLast = i === pts.length - 1;
        const idx = Number(data[i].m) - 1;
        return (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={isLast ? 3.5 : 2} fill={isLast ? '#a4762e' : '#fff'} stroke="#a4762e" strokeWidth={1.5}>
              <title>{`${MESES_ABREV[idx]}: saldo ${fmtBRL(data[i].saldo)}`}</title>
            </circle>
            <text x={p[0]} y={H} fontSize={9.5} textAnchor="middle" fill="#96958a">
              {MESES_ABREV[idx]}
            </text>
          </g>
        );
      })}
      <text
        x={pts[pts.length - 1][0]}
        y={pts[pts.length - 1][1] - 8}
        fontSize={10}
        textAnchor="end"
        fill="#25282f"
        fontWeight={700}
      >
        {fmtBRL(data[data.length - 1].saldo)}
      </text>
    </svg>
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
