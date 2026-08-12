# Sistema de design — tema "costeiro" (Nova Almeida)

Referência do tema visual em uso no site. Criado a partir de um design gerado no
Lovable (paleta "Coastal salt & sun") e adaptado para o app real.

**Status atual**: a Home (`Home.tsx`) e a Mídia do Culto (`Midia.tsx`) já têm o
tratamento estrutural completo (formas, espaçamento, tipografia). O resto do
site (financeiro, admin, login, relatórios) herdou só as **cores** via os
tokens do Tailwind — o layout/formato dos componentes ainda é o antigo. Aplicar
esse documento nas telas restantes é o próximo passo.

## Cores

Definidas em `frontend/tailwind.config.js`, em `oklch()` para fidelidade exata.
Os tokens antigos (`bg`, `ink`, `accent`...) **já apontam** para os valores
costeiros — usar os nomes semânticos abaixo, não os `coastXxx` diretamente,
exceto quando for um bloco de cor forte e deliberado (hero, faixas).

| Token semântico | Valor oklch | Papel |
|---|---|---|
| `bg` / `coastSand` | `oklch(0.99 0.003 95)` | Fundo da página (areia) |
| `surface` | `#ffffff` | Fundo de cards |
| `surface2` | `oklch(0.95 0.012 70)` | Fundo secundário (inputs, linhas alternadas) |
| `border` | `oklch(0.22 0.02 60 / 10%)` | Bordas (tinta a 10% de opacidade) |
| `ink` / `coastInk` | `oklch(0.22 0.02 60)` | Texto principal (tinta) |
| `inkSecondary` | `oklch(0.45 0.02 60)` | Texto secundário |
| `muted` | `oklch(0.6 0.02 60)` | Texto terciário/legendas |
| `accent` / `coastClay` | `oklch(0.66 0.14 38)` | Cor de marca (argila) — botões primários, links, eyebrows |
| `accentStrong` | `oklch(0.5 0.12 38)` | Argila escura (hover) |
| `accentSoft` | `oklch(0.93 0.04 45)` | Argila clara (badges) |
| `coastOcean` | `oklch(0.45 0.08 195)` | Azul-esverdeado (oceano) — faixas de destaque, CTAs escuros |
| `coastMist` | `oklch(0.93 0.01 175)` | Névoa — fundo de badges/eyebrows, placeholders de imagem |

**Cores semânticas mantidas sem mudança** (carregam significado, não fazem
parte da "marca"): `income`/`incomeSoft` (verde, entradas), `expense`/`expenseSoft`
(terracota, saídas), `sage` (crachá do grupo Mídia).

## Tipografia

- **Serif (`font-serif`)**: [Fraunces](https://fonts.google.com/specimen/Fraunces) — títulos, `h1`-`h6`. Usa itálico em palavras de destaque dentro do título (ex: `<span className="text-coastClay italic">`).
- **Sans (`font-sans`)**: [Outfit](https://fonts.google.com/specimen/Outfit) — corpo de texto, UI, botões.
- Carregadas via Google Fonts em `frontend/index.html` (`@import` bloqueado em Artifacts, mas ok no app real).

Escala usada até agora (ajustar por contexto):
- Hero h1: `text-[38px] sm:text-[52px] md:text-[60px]`
- Título de seção: `text-[32px] md:text-[42px]`
- Título de card: `text-[16px]`–`text-[24px]`
- Corpo: `text-[13.5px]`–`text-[17px]`
- Eyebrow/badge: `text-[10px]`–`text-[11px]`, uppercase, `tracking-widest`

## Formas e espaçamento

- **Cantos**: bem mais arredondados que o tema antigo. `rounded-2xl` (16px) em
  cards de conteúdo, `rounded-[2rem]` em blocos de destaque grandes (CTA final),
  `rounded-full` em badges/pills e botões de destaque.
- **Cards**: fundo `surface2`/`coastMist` para a área de imagem, texto centralizado
  ou à esquerda conforme o contexto, mais respiro (`p-6`/`p-7` em vez de `p-4`).
- **Eyebrow/badge**: pill pequeno, `bg-coastMist rounded-full px-3 py-1`,
  texto `text-coastOcean` ou `text-accent`, uppercase, `tracking-widest`.
- **Blocos de cor fortes**: usar `coastOcean` (faixas escuras, seções de
  contraste) ou `coastClay` (blocos de CTA) como fundo sólido/gradiente,
  texto branco — reservar para 1-2 momentos por página, não usar em excesso.
- **Botões**: `rounded-md` (retangular, cantos leves) para ações de formulário;
  `rounded-full` para CTAs de destaque (hero, banners).
- **Imagens**: sempre com `object-cover` + `aspect-*` fixo (não deixar esticar).
  Cards de galeria usam `aspect-square`; hero usa `aspect-[4/5]`; blocos
  editoriais usam `aspect-video`.

## Padrão de página (Home/Mídia como referência)

1. Eyebrow pill (opcional, contexto)
2. Título serifado grande, com palavra de destaque em itálico/cor de marca
3. Parágrafo descritivo, `text-inkSecondary`, largura limitada (`max-w-lg`/`max-w-[62ch]`)
4. Conteúdo principal (grid de cards, ou seções alternando fundo claro/`coastOcean`)
5. CTA final opcional, bloco de cor sólida (`coastClay`), só quando relevante ao contexto (ex: não autenticado)

## O que falta aplicar

Financeiro (Entradas e Saídas, Relatórios, Lançamentos), Admin (Membros,
Campanhas, Cultos, Auditoria, Informações) e as telas de login/senha ainda
usam o layout de tabelas/cards compactos original — só as cores mudaram. Para
aplicar esse sistema de verdade nessas telas, o padrão seria: títulos maiores
em serifa, cards com `rounded-2xl` e mais respiro, eyebrows em vez de labels
simples, e — onde fizer sentido — trocar tabelas densas por cards/listas mais
espaçadas no estilo editorial acima.
