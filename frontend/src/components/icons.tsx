import { useState } from 'react';

type Props = { className?: string };
const base = 'icon';

/**
 * Usa /public/logo.png (o logo real da igreja) quando presente; se o arquivo
 * ainda não foi adicionado ao projeto, cai automaticamente no emblema desenhado.
 */
export const Emblem = ({ className = 'w-14 h-14' }: Props) => {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return <EmblemDove className={className} />;
  return (
    <img
      src="/logo.png"
      alt="Logo da Assembleia de Deus de Nova Almeida"
      className={`${className} object-contain rounded-full`}
      onError={() => setFalhou(true)}
    />
  );
};

export const IconCamera = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
    <circle cx="12" cy="13" r="3.3" />
  </svg>
);
export const IconVideo = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <rect x="3" y="6" width="12" height="12" rx="2" />
    <path d="M15 9.5l5-3v11l-5-3" />
  </svg>
);
export const IconDownload = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M12 3v12" />
    <path d="M7.5 10.5L12 15l4.5-4.5" />
    <path d="M5 19h14" />
  </svg>
);
export const IconEdit = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
export const IconTrash = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M4 7h16" />
    <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
    <path d="M6 7l1 12.5A2 2 0 0 0 9 21h6a2 2 0 0 0 2-2.5L18 7" />
  </svg>
);
export const IconLock = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
  </svg>
);
export const IconCheck = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
export const IconUsers = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M15.5 4.7a3.4 3.4 0 0 1 0 6.6" />
    <path d="M17.5 13.3A6.5 6.5 0 0 1 21.5 20" />
  </svg>
);
export const IconPlus = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconPin = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);
export const IconClock = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
export const IconShield = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
  </svg>
);
export const IconImage = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M4 17l5-5 4 4 3-3 4 4" />
  </svg>
);
export const IconBook = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5z" />
    <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5z" />
  </svg>
);
export const IconInfo = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6" />
    <path d="M12 7.5h.01" />
  </svg>
);
export const IconWallet = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <circle cx="16.3" cy="13" r="1.3" />
  </svg>
);
export const IconChevronLeft = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24" style={{ transform: 'rotate(90deg)' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const IconChevronDown = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const IconMenu = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const IconX = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconArrowLeft = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const IconArrowRight = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const IconTarget = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const IconEye = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const IconEyeOff = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M3 3l18 18" />
    <path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.6 4.6M6.5 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4.2-.9" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);
export const IconPaperclip = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M7 12.5l6.5-6.5a3 3 0 0 1 4.24 4.24L10.5 17.5a5 5 0 0 1-7.07-7.07L11 3" />
  </svg>
);
export const IconGift = ({ className = base }: Props) => (
  <svg className={className} viewBox="0 0 24 24">
    <rect x="4" y="10" width="16" height="10" rx="1.3" />
    <path d="M4 10h16v3.5H4z" />
    <path d="M12 10v10" />
    <path d="M12 10c-1.2-3-3-4.6-4.6-4.6A2.2 2.2 0 0 0 5.2 7.6C5.2 9 7 10 12 10z" />
    <path d="M12 10c1.2-3 3-4.6 4.6-4.6A2.2 2.2 0 0 1 18.8 7.6c0 1.4-1.8 2.4-6.8 2.4z" />
  </svg>
);

export const EmblemDove = ({ className = 'w-14 h-14' }: Props) => (
  <svg className={className} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="emblemGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f0e6cf" />
        <stop offset="1" stopColor="#a4762e" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="47" fill="none" stroke="#7d5920" strokeWidth="1.4" />
    <circle cx="50" cy="50" r="42.5" fill="url(#emblemGrad)" />
    <circle cx="50" cy="50" r="42.5" fill="none" stroke="#7d5920" strokeWidth="0.6" opacity=".6" />
    <g fill="#1f2740">
      <polygon points="28,58 19,63 29.5,52" />
      <ellipse cx="46" cy="54" rx="19" ry="10" transform="rotate(-12 46 54)" />
      <ellipse cx="39" cy="45.5" rx="13" ry="6.3" transform="rotate(-34 39 45.5)" opacity=".78" />
      <circle cx="63" cy="47" r="6.2" />
      <polygon points="69,46.6 75.5,45 69.7,50" />
      <circle cx="64.6" cy="45.3" r="0.9" fill="#f0e6cf" />
    </g>
    <g fill="#6f7a52" stroke="#6f7a52">
      <path d="M55 63 C 50 69, 42 71.5, 33.5 69.5" fill="none" strokeWidth="1.7" strokeLinecap="round" />
      <ellipse cx="51.5" cy="64.5" rx="3.5" ry="1.5" transform="rotate(-38 51.5 64.5)" stroke="none" />
      <ellipse cx="45.3" cy="68" rx="3.5" ry="1.5" transform="rotate(-14 45.3 68)" stroke="none" />
      <ellipse cx="38.8" cy="69.6" rx="3.2" ry="1.4" transform="rotate(8 38.8 69.6)" stroke="none" />
      <ellipse cx="34" cy="69.3" rx="2.9" ry="1.3" transform="rotate(24 34 69.3)" stroke="none" />
    </g>
  </svg>
);
