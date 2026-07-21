# Prompt para colar no Antigravity

Copie o texto abaixo (ajuste o caminho dos arquivos se necessário) junto com
os arquivos da pasta `convitin-design-system/` anexados ao projeto.

---

Quero substituir o sistema de temas/cores atual do Convitin por um Design
Token System completo, o "Convitin Design Language (CDL)". Os arquivos já
prontos estão em `convitin-design-system/` (tokens/foundations.json,
tokens/themes.json, tokens/semantic.json, tokens/components.json,
css/tokens.css, tailwind.tokens.js, ThemePicker.jsx).

Faça o seguinte:

1. Copie `css/tokens.css` para o projeto e importe-o globalmente (antes de
   qualquer outro CSS de componente).
2. Importe `tailwind.tokens.js` dentro de `tailwind.config.js`, em
   `theme.extend`, substituindo qualquer cor HEX fixa que exista hoje na
   config.
3. Faça um find-and-replace em todo o código: qualquer HEX hardcoded (ex.:
   `#D91C73`, `bg-[#...]`, inline style com cor) deve virar uma classe/token
   semântico correspondente (`bg-primary`, `text-text-body`,
   `border-border`, etc. — ver README.md para a lista completa).
4. No componente de lista (a página pública que os convidados acessam),
   aplique `data-theme="{slug-do-tema-da-lista}"` no elemento raiz da
   página, usando os slugs de `tokens/themes.json`
   (`algodao-rosa`, `champagne-chic`, `eucalipto-organico`, `oceano`,
   `pessego`, `terracota`, `grafite`, `cyberpunk`).
5. No restante do site (home, dashboard, configurações, login), NÃO defina
   `data-theme` — deixe o tema `base-azul-minimal` do `:root` ser o padrão.
6. Na tela de "Configurações da Lista" (troca de tema), substitua o grid
   atual de 5 cards simples pelo componente `ThemePicker.jsx` anexado,
   adaptando o markup interno ao design system de componentes já usado no
   projeto, mas mantendo a lógica: cada card é um mini-mockup real (header,
   dots, card de presente, badge) renderizado com os tokens daquele tema,
   não apenas quadradinhos de cor.
7. Migre os componentes existentes (Button, Card, Input, Badge, Chip, Tabs,
   Modal, Toast, Header, Footer, filtros, paginação) para usar os tokens de
   `tokens/components.json` como referência de quais variáveis CSS cada
   parte do componente deve consumir.
8. Rode um build e confirme visualmente que os 9 temas (o padrão + os 8 de
   lista) renderizam sem nenhuma cor HEX residual no código.

Não invente cores novas fora da escala gerada. Se for necessário um tom que
não existe, ele deve ser adicionado regenerando a escala via
`generate.py` (ajustando hue/sat/base_l do tema), nunca digitado à mão.

---
