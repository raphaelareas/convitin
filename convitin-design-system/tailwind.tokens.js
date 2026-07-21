/**
 * Convitin Design Language (CDL) — Tailwind bridge
 * -------------------------------------------------
 * Importa este arquivo no seu tailwind.config.js:
 *
 *   const cdl = require('./tailwind.tokens.js');
 *   module.exports = { theme: { extend: cdl } };
 *
 * Todas as classes abaixo resolvem para variáveis CSS (--background, --primary, etc.)
 * definidas em css/tokens.css. Trocar de tema = trocar o atributo data-theme no <html>
 * ou no container da lista. Nenhum componente deve usar HEX diretamente.
 */
module.exports = {
  colors: {
    background: "var(--background)",
    surface: "var(--surface)",
    "surface-elevated": "var(--surface-elevated)",
    "surface-hover": "var(--surface-hover)",
    "surface-active": "var(--surface-active)",
    border: "var(--border)",
    "border-hover": "var(--border-hover)",
    "border-focus": "var(--border-focus)",

    "text-title": "var(--text-title)",
    "text-heading": "var(--text-heading)",
    "text-body": "var(--text-body)",
    "text-muted": "var(--text-muted)",
    "text-disabled": "var(--text-disabled)",
    "text-inverse": "var(--text-inverse)",

    primary: {
      DEFAULT: "var(--primary)",
      hover: "var(--primary-hover)",
      active: "var(--primary-active)",
      soft: "var(--primary-soft)",
      surface: "var(--primary-surface)",
    },
    "on-primary": "var(--on-primary)",

    secondary: {
      DEFAULT: "var(--secondary)",
      hover: "var(--secondary-hover)",
      surface: "var(--secondary-surface)",
    },
    "on-secondary": "var(--on-secondary)",

    success: { DEFAULT: "var(--success)", surface: "var(--success-surface)" },
    warning: { DEFAULT: "var(--warning)", surface: "var(--warning-surface)" },
    danger:  { DEFAULT: "var(--danger)",  surface: "var(--danger-surface)" },
    info:    { DEFAULT: "var(--info)",    surface: "var(--info-surface)" },

    // Escala crua do accent do tema ativo, para casos avançados (gráficos, ilustrações)
    accent: {
      1: "var(--accent-1)", 2: "var(--accent-2)", 3: "var(--accent-3)",
      4: "var(--accent-4)", 5: "var(--accent-5)", 6: "var(--accent-6)",
      7: "var(--accent-7)", 8: "var(--accent-8)", 9: "var(--accent-9)",
      10: "var(--accent-10)", 11: "var(--accent-11)", 12: "var(--accent-12)",
    },
  },
  borderRadius: {
    none: "var(--radius-none)", xs: "var(--radius-xs)", sm: "var(--radius-sm)",
    md: "var(--radius-md)", lg: "var(--radius-lg)", xl: "var(--radius-xl)",
    "2xl": "var(--radius-2xl)", full: "var(--radius-full)",
  },
  boxShadow: {
    xs: "var(--shadow-xs)", sm: "var(--shadow-sm)", md: "var(--shadow-md)",
    lg: "var(--shadow-lg)", xl: "var(--shadow-xl)",
  },
  spacing: Object.fromEntries(
    [2,4,8,12,16,20,24,32,40,48,64,80].map((v) => [v, `var(--spacing-${v})`])
  ),
};
