/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        '4.5': '1.125rem',
      },
      colors: {
        // Paleta "costeira" (Nova Almeida): os tokens de sempre (bg/ink/accent/...)
        // agora SÃO a paleta costeira — assim o app inteiro (financeiro, admin,
        // login etc.) herda o novo tema automaticamente, sem editar tela por tela.
        // Valores em oklch para fidelidade exata (navegadores modernos suportam
        // oklch() nativamente).
        bg: 'oklch(0.99 0.003 95)',
        surface: '#ffffff',
        surface2: 'oklch(0.95 0.012 70)',
        border: 'oklch(0.22 0.02 60 / 10%)',
        ink: 'oklch(0.22 0.02 60)',
        inkSecondary: 'oklch(0.45 0.02 60)',
        muted: 'oklch(0.6 0.02 60)',
        accent: 'oklch(0.66 0.14 38)',
        accentStrong: 'oklch(0.5 0.12 38)',
        accentSoft: 'oklch(0.93 0.04 45)',
        // Cores semânticas (papéis, financeiro) — mantidas de propósito, já que
        // carregam significado (verde=entrada, terracota=saída) independente do tema.
        sage: '#6f7a52',
        navy: '#1f2740',
        income: '#4f7a56',
        incomeSoft: '#e7ede4',
        expense: '#a1543c',
        expenseSoft: '#f1e4dd',
        // Aliases explícitos da paleta costeira, para blocos de cor fortes (hero,
        // faixas) que não devem seguir a leitura mais neutra de ink/accent.
        coastSand: 'oklch(0.99 0.003 95)',
        coastClay: 'oklch(0.66 0.14 38)',
        coastOcean: 'oklch(0.45 0.08 195)',
        coastInk: 'oklch(0.22 0.02 60)',
        coastMist: 'oklch(0.93 0.01 175)',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', '"Iowan Old Style"', '"Palatino Linotype"', 'serif'],
        sans: ['Outfit', '-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,20,20,.05), 0 4px 14px rgba(20,20,20,.05)',
      },
    },
  },
  plugins: [],
};
