import React from "react";
import themes from "./tokens/themes.json";
import semantic from "./tokens/semantic.json";

/**
 * ThemePicker — mini preview estilo Linear/Notion
 * -------------------------------------------------
 * Cada card renderiza um mini-mockup real da lista (header, avatar dots,
 * card de presente, botão) usando os tokens do próprio tema — não apenas
 * 3 quadradinhos de cor. Isso é o que dá a "cara premium" pedida na Fase 6.
 *
 * Uso:
 *   <ThemePicker value={selectedSlug} onChange={setSelectedSlug} />
 */
interface ThemePickerProps {
  value: string;
  onChange?: (theme: string) => void;
}

export default function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
      {Object.entries(themes).map(([slug, theme]) => {
        const t = (semantic as any)[slug].tokens;
        const selected = value === slug;
        return (
          <button
            key={slug}
            onClick={() => onChange?.(slug)}
            style={{
              textAlign: "left",
              cursor: "pointer",
              border: selected ? `2px solid ${t.primary}` : "1px solid #E5E5E5",
              borderRadius: 14,
              padding: 10,
              background: "#fff",
              boxShadow: selected ? `0 0 0 3px ${t.primarySoft}` : "none",
              transition: "box-shadow .15s, border-color .15s",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#111" }}>
              {theme.label}
            </div>

            {/* mini mockup */}
            <div style={{ background: t.background, borderRadius: 10, padding: 8, border: `1px solid ${t.border}` }}>
              {/* header */}
              <div style={{
                background: t.surface, borderRadius: 6, padding: "6px 8px",
                display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6,
              }}>
                <div style={{ width: 28, height: 6, borderRadius: 3, background: t.textTitle, opacity: 0.85 }} />
                <div style={{ width: 16, height: 6, borderRadius: 3, background: t.primary }} />
              </div>

              {/* dots (avatars/status) */}
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {[t.primary, t.success, t.warning, t.info].map((c, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: 999, background: c }} />
                ))}
              </div>

              {/* card de presente */}
              <div style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8,
                padding: 6, marginBottom: 6,
              }}>
                <div style={{ width: "100%", height: 24, borderRadius: 4, background: t.secondarySurface, marginBottom: 4 }} />
                <div style={{ width: "70%", height: 5, borderRadius: 3, background: t.textMuted, opacity: 0.6, marginBottom: 4 }} />
                <div style={{
                  display: "inline-block", fontSize: 8, color: t.onPrimary, background: t.primary,
                  borderRadius: 999, padding: "3px 8px",
                }}>
                  Selecionar
                </div>
              </div>

              {/* badge */}
              <div style={{
                display: "inline-block", fontSize: 8, color: t.success, background: t.successSurface,
                borderRadius: 999, padding: "2px 6px",
              }}>
                Disponível
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
