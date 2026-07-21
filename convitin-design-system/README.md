# Convitin Design Language (CDL)

Sistema de design tokens do Convitin, inspirado na metodologia de escalas do
Radix Colors e na arquitetura de temas de produtos como Linear, Stripe e
Shopify Polaris. Nenhum componente deve usar HEX diretamente — tudo passa por
token semântico.

## Estrutura de arquivos

```
convitin-design-system/
├── tokens/
│   ├── foundations.json   # neutros, feedback, radius, shadow, spacing, opacity
│   ├── themes.json        # escala 1–12 do accent de cada tema (9 temas)
│   ├── semantic.json      # tokens semânticos resolvidos por tema
│   └── components.json    # tokens de componente (button, card, input...)
├── css/
│   └── tokens.css         # variáveis CSS, uma seção por [data-theme="..."]
├── tailwind.tokens.js     # bridge para tailwind.config.js
├── ThemePicker.jsx        # componente de referência do seletor de tema
├── generate.py            # gera foundations.json + themes.json
├── generate_semantic.py   # gera semantic.json + components.json
└── generate_css.py        # gera css/tokens.css a partir dos JSONs
```

Se você (ou o Antigravity) precisar ajustar uma cor, **não edite o CSS na
mão**: mude `hue`/`sat`/`base_l` em `generate.py` e rode os três scripts
(`generate.py` → `generate_semantic.py` → `generate_css.py`) para
regenerar tudo de forma consistente.

## Os 3 níveis de token

1. **Foundations** — a base que nunca muda entre temas: neutros (cinzas),
   cores de feedback (success/warning/danger/info), radius, shadow, spacing,
   opacity.
2. **Accent scale (1–12)** — cada tema define só isso: uma escala de 12 tons
   da sua cor principal, do mais claro (1) ao mais escuro/contrastante (12),
   seguindo a lógica do Radix:
   - `1–2` → fundos muito sutis
   - `3–5` → fundos de hover/seleção
   - `6–8` → bordas
   - `9–10` → cor sólida (botão) e seu hover
   - `11–12` → texto sobre fundo claro
3. **Semantic tokens** — o que os componentes realmente consomem:
   `background`, `surface`, `border`, `primary`, `primaryHover`, `textBody`,
   `success`, etc. É esse nível que aparece no `components.json` e no
   Tailwind.

## Os 9 temas gerados

| Slug | Tema | Modo |
|---|---|---|
| `base-azul-minimal` | Azul Minimal — **padrão do site** (fora de listas) | light |
| `algodao-rosa` | ☁️ Rosa Algodão | light |
| `champagne-chic` | 🥂 Champagne Chic | light |
| `eucalipto-organico` | 🌿 Eucalipto Orgânico | light |
| `oceano` | 🌊 Oceano | light |
| `pessego` | 🍑 Pêssego | light |
| `terracota` | 🌅 Terracota | light |
| `grafite` | ⚫ Grafite | light (accent escuro) |
| `cyberpunk` | 🌌 Cyberpunk | dark |

`base-azul-minimal` é aplicado no `:root` (fora de qualquer lista, ex:
home, dashboard, configurações) e também funciona como `data-theme`, então
ele é o fallback caso nenhum tema de lista esteja definido.

## Como aplicar um tema

```html
<!-- tema de uma lista específica -->
<div data-theme="champagne-chic">
  ...toda a página da lista usa as variáveis desse tema...
</div>
```

```css
.button-primary {
  background: var(--primary);
  color: var(--on-primary);
  border-radius: var(--radius-sm);
}
.button-primary:hover { background: var(--primary-hover); }
```

Com Tailwind (depois de importar `tailwind.tokens.js`):

```jsx
<button className="bg-primary hover:bg-primary-hover text-on-primary rounded-sm px-4 py-2">
  Selecionar presente
</button>
```

## Preview dos temas (Fase 6)

`ThemePicker.jsx` é a implementação de referência do seletor de tema estilo
Linear/Notion pedido: cada card renderiza um mini-mockup real (header, dots
de status, card de presente, badge) usando os tokens do tema, não só 3
quadradinhos de cor. Adapte o JSX ao seu design system de componentes atual.

## Nota sobre acessibilidade

`onPrimary` é calculado automaticamente (branco ou quase-preto, o que der
mais contraste contra `accent-9`). Em temas bem pastel (ex.: Rosa Algodão,
Champagne) o contraste do texto sobre o botão fica próximo do mínimo AA
(4.2–4.5:1). Se for usar texto pequeno em cima do botão primário desses
temas, considere escurecer levemente o `base_l` desse tema em `generate.py`
(reduzir 3–5 pontos) e regenerar.

## Adicionar um 10º tema no futuro

1. Em `generate.py`, adicione uma linha em `theme_defs` com um slug, label,
   `hue` (0–360), `sat` (0–100) e `base_l` (lightness do tom 9, o botão).
2. Rode os três scripts na ordem.
3. Pronto — o novo tema já tem as 12 escalas, os tokens semânticos, os
   tokens de componente e aparece automaticamente no `ThemePicker`.

Nenhuma cor nova precisa ser "inventada" manualmente — é só escolher o hue
de base e o gerador aplica a mesma curva de luminosidade/saturação usada em
todos os outros temas, o que garante contraste e consistência.
