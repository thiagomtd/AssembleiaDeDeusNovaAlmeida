import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { IconEye, IconEyeOff } from './icons';
import { Button as ShadcnButton } from './ui/button';
import { Badge as ShadcnBadge } from './ui/badge';
import { cn } from '../lib/utils';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-surface border border-border rounded-2xl shadow-card ${className}`}>{children}</div>;
}

// Com ícone = eyebrow de título de página (vira selo/pill, estilo costeiro).
// Sem ícone = rótulo pequeno de estatística/card (continua discreto, sem pill).
export function Eyebrow({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  if (icon) {
    return (
      <p className="inline-flex items-center gap-1.5 bg-coastMist rounded-full px-3 py-1 text-[10.5px] uppercase tracking-widest text-coastOcean font-bold mb-3">
        {icon}
        {children}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-[11.5px] uppercase tracking-wider text-muted font-bold mb-2">
      {children}
    </p>
  );
}

type BtnVariant = 'primary' | 'gold' | 'secondary' | 'outlineLight' | 'success' | 'info' | 'danger';
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: {
  children: ReactNode;
  variant?: BtnVariant;
  size?: 'md' | 'sm';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'inline-flex items-center gap-1.5 rounded-xl font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
  const sizeCls = size === 'sm' ? 'px-3 py-1.5 text-[12.5px] rounded-lg' : 'px-3.5 py-2 text-[13.5px]';
  const variantCls =
    variant === 'gold'
      ? 'bg-accent border border-accent text-[#241703] hover:bg-accentStrong'
      : variant === 'secondary'
        ? 'bg-transparent border border-border text-ink hover:bg-surface2'
        : variant === 'outlineLight'
          ? 'bg-white/10 border border-white/25 text-white hover:bg-white/20'
          : variant === 'success'
            ? 'bg-successSoft border border-success/30 text-success hover:bg-success hover:text-white hover:border-success'
            : variant === 'info'
              ? 'bg-infoSoft border border-info/30 text-info hover:bg-info hover:text-white hover:border-info'
              : variant === 'danger'
                ? 'bg-danger border border-danger text-white hover:bg-dangerStrong'
                : 'bg-ink border border-ink text-surface hover:opacity-90';
  return (
    <ShadcnButton className={cn(base, sizeCls, variantCls, className)} {...props}>
      {children}
    </ShadcnButton>
  );
}

type PillTone = 'active' | 'inactive' | 'income' | 'expense' | 'role-admin' | 'role-member' | 'role-midia' | 'role-tesouraria';
const pillTones: Record<PillTone, string> = {
  active: 'bg-incomeSoft text-income',
  inactive: 'bg-surface2 text-muted',
  income: 'bg-incomeSoft text-income',
  expense: 'bg-expenseSoft text-expense',
  'role-admin': 'bg-accentSoft text-accentStrong',
  'role-member': 'bg-surface2 text-inkSecondary border border-border',
  'role-midia': 'bg-sage/15 text-sage',
  'role-tesouraria': 'bg-incomeSoft text-income',
};
export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <ShadcnBadge className={cn('h-auto gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold transition-colors duration-150', pillTones[tone])}>
      {children}
    </ShadcnBadge>
  );
}

export function StatTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: 'income' | 'expense';
  hint?: string;
}) {
  const toneCls = tone === 'income' ? 'text-income' : tone === 'expense' ? 'text-expense' : 'text-ink';
  return (
    <Card className="p-4">
      <Eyebrow>{label}</Eyebrow>
      <div className={`font-serif text-2xl ${toneCls}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}
    </Card>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 w-full min-w-0">
      <span className="text-xs text-inkSecondary font-semibold">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full min-w-0 max-w-full box-border bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[13.5px] text-ink placeholder:text-muted outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/30';

export function PasswordField({
  label,
  hint,
  ...props
}: {
  label: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const [visivel, setVisivel] = useState(false);
  return (
    <Field label={label} hint={hint}>
      <div className="relative w-full min-w-0">
        <input type={visivel ? 'text' : 'password'} className={`${inputCls} pr-10`} {...props} />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-inkSecondary"
          tabIndex={-1}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visivel ? <IconEyeOff className="icon w-4 h-4" /> : <IconEye className="icon w-4 h-4" />}
        </button>
      </div>
    </Field>
  );
}

export function PrivacyNote({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start bg-surface2 border border-border rounded-xl px-4 py-3.5 text-[12.5px] text-inkSecondary">
      {icon}
      <span>{children}</span>
    </div>
  );
}

export function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Compara ignorando maiúsculas/minúsculas e acentos (ex: "sergio" acha "Sérgio").
export function normalizarBusca(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function combina(busca: string, ...campos: (string | undefined)[]) {
  const alvo = normalizarBusca(busca.trim());
  if (!alvo) return true;
  return campos.some((c) => c && normalizarBusca(c).includes(alvo));
}

export function Pagination({
  pagina,
  totalPaginas,
  onChange,
}: {
  pagina: number;
  totalPaginas: number;
  onChange: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2.5 px-4.5 py-3 border-t border-border">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pagina <= 1}
        onClick={() => onChange(pagina - 1)}
      >
        Anterior
      </Button>
      <span className="text-[12px] text-muted">
        Página {pagina} de {totalPaginas}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pagina >= totalPaginas}
        onClick={() => onChange(pagina + 1)}
      >
        Próxima
      </Button>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Buscar...'}
      className="w-full sm:w-56 bg-surface2 border border-border rounded-lg px-3 py-1.5 text-[13px] text-ink placeholder:text-muted outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/30"
    />
  );
}
