const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function MonthPicker({
  mes,
  ano,
  onChange,
}: {
  mes: number;
  ano: number;
  onChange: (mes: number, ano: number) => void;
}) {
  const anos = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const selectCls = 'min-w-0 max-w-full bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-[13px] text-ink';

  return (
    <div className="flex items-center gap-2 flex-wrap min-w-0">
      <select className={selectCls} value={mes} onChange={(e) => onChange(Number(e.target.value), ano)}>
        {MESES.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select className={selectCls} value={ano} onChange={(e) => onChange(mes, Number(e.target.value))}>
        {anos.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}
