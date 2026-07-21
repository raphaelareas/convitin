'use client';

import React, { useState, useEffect } from 'react';
import themesData from '../../../convitin-design-system/tokens/themes.json';
import semanticData from '../../../convitin-design-system/tokens/semantic.json';
import foundationsData from '../../../convitin-design-system/tokens/foundations.json';

// Helper function to resolve token names (e.g. "{primary}" or "{radius.sm}" or "{shadow.xs}") to CSS variable properties or actual values
function resolveTokenValue(val: string, activeTheme: string): string {
  if (!val) return '';
  if (val.startsWith('{') && val.endsWith('}')) {
    const rawName = val.slice(1, -1);
    if (rawName.startsWith('radius.')) {
      const radKey = rawName.split('.')[1];
      return (foundationsData.radius as any)[radKey] || '0px';
    }
    if (rawName.startsWith('shadow.')) {
      const shKey = rawName.split('.')[1];
      return (foundationsData.shadow as any)[shKey] || 'none';
    }
    // Else map to semantic properties or css variable names
    const cssVarMapping: Record<string, string> = {
      'primary': 'var(--primary)',
      'primaryHover': 'var(--primary-hover)',
      'primaryActive': 'var(--primary-active)',
      'primarySoft': 'var(--primary-soft)',
      'primarySurface': 'var(--primary-surface)',
      'onPrimary': 'var(--on-primary)',
      'secondary': 'var(--secondary)',
      'secondaryHover': 'var(--secondary-hover)',
      'secondarySurface': 'var(--secondary-surface)',
      'onSecondary': 'var(--on-secondary)',
      'surface': 'var(--surface)',
      'surfaceHover': 'var(--surface-hover)',
      'surfaceActive': 'var(--surface-active)',
      'surfaceElevated': 'var(--surface-elevated)',
      'border': 'var(--border)',
      'borderHover': 'var(--border-hover)',
      'borderFocus': 'var(--border-focus)',
      'textTitle': 'var(--text-title)',
      'textHeading': 'var(--text-heading)',
      'textBody': 'var(--text-body)',
      'textMuted': 'var(--text-muted)',
      'textDisabled': 'var(--text-disabled)',
      'textInverse': 'var(--text-inverse)',
      'success': 'var(--success)',
      'successSurface': 'var(--success-surface)',
      'warning': 'var(--warning)',
      'warningSurface': 'var(--warning-surface)',
      'danger': 'var(--danger)',
      'dangerSurface': 'var(--danger-surface)',
      'info': 'var(--info)',
      'infoSurface': 'var(--info-surface)',
      'background': 'var(--background)'
    };
    return cssVarMapping[rawName] || `var(--${rawName})`;
  }
  return val;
}

// Convert HLS to HEX in JS (equivalent to Python colorsys logic)
function hlsToHex(h: number, l: number, s: number): string {
  const hNorm = (h % 360) / 360;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;

  let r = 0, g = 0, b = 0;
  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    const hue2rgb = (t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    r = hue2rgb(hNorm + 1/3);
    g = hue2rgb(hNorm);
    b = hue2rgb(hNorm - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16).toUpperCase();
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Relative luminance for contrast calculation
function relativeLuminance(hexColor: string): number {
  const cleanHex = hexColor.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const lin = (c: number) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const rL = lin(r);
  const gL = lin(g);
  const bL = lin(b);
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

// Contrast ratio calculator
function getContrastRatio(bgHex: string, fgHex: string): number {
  const l1 = relativeLuminance(bgHex);
  const l2 = relativeLuminance(fgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function DesignPlaygroundPage() {
  const [activeTheme, setActiveTheme] = useState<string>('base-azul-minimal');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Password Protection / Environmental protection state
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Live theme generator states
  const [hue, setHue] = useState<number>(243);
  const [sat, setSat] = useState<number>(68);
  const [baseL, setBaseL] = useState<number>(58);
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // Verify access requirements on mount
  useEffect(() => {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      setAuthorized(true);
    }
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, require password check
    const playPass = process.env.NEXT_PUBLIC_PLAYGROUND_PASSWORD || 'convitin-dev-rules';
    if (passwordInput === playPass) {
      setAuthorized(true);
      setAuthError('');
    } else {
      setAuthError('Senha incorreta! Acesso negado.');
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!authorized) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '1.5rem'
      }}>
        <div style={{
          background: '#ffffff',
          padding: '2.5rem',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          maxWidth: '400px',
          width: '100%',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', color: '#0f172a', textAlign: 'center' }}>
            🔒 Acesso Restrito
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' }}>
            Esta é uma ferramenta de desenvolvimento interna do Convitin. Por favor, forneça a senha do painel para prosseguir.
          </p>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="password"
              placeholder="Digite a senha de desenvolvimento"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
            {authError && (
              <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '600' }}>
                {authError}
              </span>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              Confirmar Acesso
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate live scale
  const liveLightScaleL = [98.5, 96.5, 93.5, 89.5, 84.5, 78, 69, 58, baseL, Math.max(baseL - 8, 10), 38, 17];
  const liveLightScaleS = [sat * 0.20, sat * 0.28, sat * 0.34, sat * 0.40, sat * 0.46, sat * 0.52, sat * 0.58, sat * 0.66, sat * 1.00, Math.min(sat * 1.05, 100), sat * 0.80, sat * 0.55];

  const liveDarkScaleL = [9, 12, 15, 19, 24, 30, 38, 47, baseL, Math.min(baseL + 9, 90), 78, 93];
  const liveDarkScaleS = [sat * 0.35, sat * 0.40, sat * 0.45, sat * 0.50, sat * 0.55, sat * 0.60, sat * 0.65, sat * 0.72, sat * 1.00, Math.min(sat * 1.05, 100), sat * 0.55, sat * 0.30];

  const liveL = mode === 'dark' ? liveDarkScaleL : liveLightScaleL;
  const liveS = mode === 'dark' ? liveDarkScaleS : liveLightScaleS;

  const liveScaleHex: string[] = [];
  for (let i = 0; i < 12; i++) {
    liveScaleHex.push(hlsToHex(hue, liveL[i], liveS[i]));
  }

  const livePrimaryColor = liveScaleHex[8]; // Step 9
  const liveBackgroundTint = mode === 'light' ? hlsToHex(hue, 97, 100) : '#1A1A1A';
  const contrastRatio = getContrastRatio(livePrimaryColor, '#FFFFFF');
  const isContrastValid = contrastRatio >= 4.5;

  const pythonLine = `"${mode === 'dark' ? 'dark' : 'light'}-experimental": ("Custom Theme", ${hue}, ${sat}, ${baseL}, "${mode}"),`;

  // Get active theme tokens
  const activeThemeScale = (themesData as any)[activeTheme]?.scale || {};

  return (
    <div data-theme={activeTheme} style={{
      minHeight: '100vh',
      background: 'var(--background)',
      color: 'var(--text-body)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '2rem 1.5rem',
      transition: 'background 0.2s, color 0.2s',
      boxSizing: 'border-box'
    }}>
      <header style={{ maxWidth: '1200px', margin: '0 auto 2.5rem auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: 'var(--text-title)' }}>
              CDL Playground
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
              Ambiente de desenvolvimento e prototipação do Convitin Design Language.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-heading)' }}>Tema Ativo:</span>
            <select
              value={activeTheme}
              onChange={(e) => setActiveTheme(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-body)',
                fontSize: '0.9rem',
                fontWeight: '600',
                outline: 'none'
              }}
            >
              {Object.keys(themesData).map((slug) => (
                <option key={slug} value={slug}>
                  {(themesData as any)[slug].label} ({slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        {copiedText && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--primary)',
            color: 'var(--on-primary)',
            padding: '0.75rem 1.25rem',
            borderRadius: '9999px',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.85rem',
            fontWeight: '700',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease'
          }}>
            ✓ Copiado: {copiedText}
          </div>
        )}
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* Accent Scale Swatches */}
        <section className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 1.25rem 0' }}>
            Escala Accent ({activeTheme})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.75rem' }}>
            {Object.entries(activeThemeScale).map(([step, hex]) => (
              <div
                key={step}
                onClick={() => handleCopy(hex as string, `Tom ${step} (${hex})`)}
                style={{
                  cursor: 'pointer',
                  borderRadius: '10px',
                  padding: '8px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                  transition: 'transform 0.15s, border-color 0.15s'
                }}
                className="swatch-card"
              >
                <div style={{
                  height: '40px',
                  borderRadius: '6px',
                  background: hex as string,
                  marginBottom: '6px'
                }} />
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-heading)' }}>Tom {step}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{hex as string}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Component Tokens Render Gallery */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Col 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Buttons */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>Botões</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button className="btn btn-primary" style={{ width: '100%' }}>Botão Primário</button>
                <button className="btn btn-secondary" style={{ width: '100%' }}>Botão Secundário</button>
                <button className="btn btn-outline" style={{
                  width: '100%',
                  background: 'transparent',
                  color: 'var(--primary)',
                  border: '1.5px solid var(--primary)',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}>Botão Outline</button>
                <button className="btn btn-danger" style={{ width: '100%' }}>Botão de Perigo</button>
              </div>
            </div>

            {/* Inputs */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>Campos de Entrada</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-heading)', display: 'block', marginBottom: '4px' }}>Input Padrão</label>
                  <input type="text" className="input-field" placeholder="Digite algo..." style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-heading)', display: 'block', marginBottom: '4px' }}>Input com Erro</label>
                  <input type="text" className="input-field" placeholder="Valor inválido" style={{ width: '100%', boxSizing: 'border-box', borderColor: 'var(--danger)' }} />
                </div>
              </div>
            </div>

            {/* Badges & Chips */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>Badges & Chips</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="badge badge-primary">Primary</span>
                <span className="badge badge-success">Success</span>
                <span className="badge badge-warning">Warning</span>
                <span className="badge badge-danger">Danger</span>
                <span className="badge badge-info">Info</span>
                <span className="badge badge-neutral">Neutral</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ padding: '4px 12px', borderRadius: '9999px', background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                  Chip Selecionado
                </div>
                <div style={{ padding: '4px 12px', borderRadius: '9999px', background: 'var(--surface-hover)', color: 'var(--text-body)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                  Chip Padrão
                </div>
              </div>
            </div>
          </div>

          {/* Col 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Card & Tabs */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>Card & Abas</h3>
              <div style={{ background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1rem' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem 1rem', borderBottom: '2.5px solid var(--primary)', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                    Aba Ativa
                  </div>
                  <div style={{ padding: '0.5rem 1rem', borderBottom: '2px solid transparent', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
                    Desativada
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: 0 }}>
                  Conteúdo interno do card de demonstração. Os cards possuem elevação suave e bordas bem definidas.
                </p>
              </div>
            </div>

            {/* Filter Pills & Progress Bar */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>Filtros & Progresso</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ padding: '6px 12px', background: 'var(--primary)', color: 'var(--on-primary)', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                  Todos
                </div>
                <div style={{ padding: '6px 12px', background: 'var(--surface)', color: 'var(--text-body)', border: '1px solid var(--border)', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                  Pendentes
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
                  <span>Progresso de Reservas</span>
                  <span>60%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--surface-hover)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', background: 'var(--primary)', borderRadius: '9999px' }} />
                </div>
              </div>
            </div>

            {/* Micro layouts (Toast, Modal, Header/Footer mock) */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>Micro-Layouts (Toast & Modal)</h3>
              
              {/* Toast Mock */}
              <div style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderLeft: '4px solid var(--success)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Presente reservado com sucesso!</span>
              </div>

              {/* Modal Mock */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1rem',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '800' }}>Confirmar Reserva?</h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Você quer confirmar a reserva deste presente?</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Cancelar</button>
                  <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Confirmar</button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Live experimental layout generator panel */}
        <section className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Controls */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 1.25rem 0' }}>
              Novo Tema (Experimental)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>
                  <span>Hue (Matiz)</span>
                  <span>{hue}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hue}
                  onChange={(e) => setHue(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>
                  <span>Saturação</span>
                  <span>{sat}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sat}
                  onChange={(e) => setSat(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>
                  <span>Luminosidade Base (Tom 9)</span>
                  <span>{baseL}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={baseL}
                  onChange={(e) => setBaseL(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Modo de Cor</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setMode('light')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: mode === 'light' ? 'var(--primary)' : 'var(--surface-hover)',
                      color: mode === 'light' ? 'var(--on-primary)' : 'var(--text-body)',
                      border: '1px solid var(--border)',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Light Mode
                  </button>
                  <button
                    onClick={() => setMode('dark')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: mode === 'dark' ? 'var(--primary)' : 'var(--surface-hover)',
                      color: mode === 'dark' ? 'var(--on-primary)' : 'var(--text-body)',
                      border: '1px solid var(--border)',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Dark Mode
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Swatches & Contrast check */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.75rem 0', color: 'var(--text-heading)' }}>Escala Gerada (Ao Vivo)</h3>
              <div style={{ display: 'flex', gap: '2px', height: '36px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {liveScaleHex.map((hex, i) => (
                  <div
                    key={i}
                    title={`Tom ${i+1}: ${hex}`}
                    style={{
                      flex: 1,
                      background: hex,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCopy(hex, `Tom ${i+1} (${hex})`)}
                  />
                ))}
              </div>
            </div>

            <div style={{
              background: liveBackgroundTint,
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: mode === 'dark' ? '#fff' : '#000' }}>Preview do Botão</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  background: isContrastValid ? 'var(--success-surface)' : 'var(--danger-surface)',
                  color: isContrastValid ? 'var(--success)' : 'var(--danger)'
                }}>
                  Contraste: {contrastRatio.toFixed(2)}:1 {isContrastValid ? '✓ OK' : '⚠ ALTO RISCO'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: livePrimaryColor,
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}>
                  Confirmar Presente
                </button>
              </div>

              {!isContrastValid && (
                <p style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: '600', margin: '8px 0 0 0' }}>
                  ⚠ Aviso: O contraste do texto branco sobre o botão primário está abaixo de 4.5:1 (mínimo recomendado para acessibilidade WCAG AA).
                </p>
              )}
            </div>

            <div>
              <button
                onClick={() => handleCopy(pythonLine, 'Linha gerada para generate.py')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  color: 'var(--on-primary)',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Copiar Linha para generate.py
              </button>
              <pre style={{
                margin: '8px 0 0 0',
                padding: '8px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                overflowX: 'auto',
                color: 'var(--text-heading)'
              }}>
                {pythonLine}
              </pre>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
