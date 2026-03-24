/**
 * lib/apex-styles.ts
 *
 * Single source of truth for all inline style values used across components.
 * Every value reads from the CSS variables defined in globals.css, which
 * automatically switch between dark and light mode.
 *
 * USAGE:
 *   import { a } from '@/lib/apex-styles';
 *   <div style={a.card}>...</div>
 *   <p style={a.textSecondary}>...</p>
 *
 * For className-based usage, use the .apex-* utility classes from globals.css
 */

import type { CSSProperties } from 'react';

// ── Backgrounds ───────────────────────────────────────────────────────────────

const card: CSSProperties = {
  background: 'var(--apex-bg-card)',
  border: '1px solid var(--apex-border-base)',
};

const cardGradient: CSSProperties = {
  background: 'linear-gradient(135deg, var(--apex-bg-card) 0%, var(--apex-bg-base) 100%)',
  border: '1px solid var(--apex-border-base)',
};

const input: CSSProperties = {
  background: 'var(--apex-bg-input)',
  border: '1px solid var(--apex-border-input)',
  color: 'var(--apex-text-primary)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '13px',
  width: '100%',
  outline: 'none',
  fontFamily: "'DM Mono', monospace",
};

const modal: CSSProperties = {
  background: 'var(--apex-bg-modal)',
  border: '1px solid var(--apex-border-base)',
};

// ── Text ──────────────────────────────────────────────────────────────────────

const textPrimary: CSSProperties   = { color: 'var(--apex-text-primary)'   };
const textSecondary: CSSProperties = { color: 'var(--apex-text-secondary)' };
const textMuted: CSSProperties     = { color: 'var(--apex-text-muted)'     };
const textLabel: CSSProperties     = { color: 'var(--apex-text-label)'     };
const textAccent: CSSProperties    = { color: 'var(--apex-accent)'         };
const textDanger: CSSProperties    = { color: 'var(--apex-danger)'         };

// ── Labels (uppercase small caps used above inputs/sections) ──────────────────

const label: CSSProperties = {
  fontSize: '10px',
  color: 'var(--apex-text-label)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontFamily: "'DM Mono', monospace",
  marginBottom: '6px',
  display: 'block',
};

// ── Borders ───────────────────────────────────────────────────────────────────

const divider: CSSProperties      = { borderBottom: '1px solid var(--apex-border-base)' };
const dividerTop: CSSProperties   = { borderTop:    '1px solid var(--apex-border-base)' };

// ── Accents ───────────────────────────────────────────────────────────────────

const accentFill: CSSProperties = {
  background: 'var(--apex-accent-dim)',
  border: '1px solid var(--apex-accent-border)',
};

const dangerFill: CSSProperties = {
  background: 'var(--apex-danger-dim)',
  border: '1px solid var(--apex-danger-border)',
};

// ── Buttons ───────────────────────────────────────────────────────────────────

const btnPrimary: CSSProperties = {
  background: 'linear-gradient(135deg, var(--apex-accent), #00d4ff)',
  color: '#070a10',
  fontFamily: "'DM Mono', monospace",
  fontWeight: 700,
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  boxShadow: '0 0 20px var(--apex-accent-glow)',
};

const btnGhost: CSSProperties = {
  background: 'var(--apex-bg-input)',
  border: '1px solid var(--apex-border-input)',
  color: 'var(--apex-text-secondary)',
  fontFamily: "'DM Mono', monospace",
  fontWeight: 600,
  borderRadius: '12px',
  cursor: 'pointer',
};

const btnDanger: CSSProperties = {
  background: 'var(--apex-danger-dim)',
  border: '1px solid var(--apex-danger-border)',
  color: 'var(--apex-danger)',
  fontFamily: "'DM Mono', monospace",
  fontWeight: 600,
  borderRadius: '12px',
  cursor: 'pointer',
};

// ── Status pills ──────────────────────────────────────────────────────────────
// These are className-based — use .apex-status-win etc. from globals.css

// ── Page header decoration bar ────────────────────────────────────────────────

const accentBar: CSSProperties = {
  width: 4,
  height: 20,
  borderRadius: 2,
  background: 'linear-gradient(180deg, var(--apex-accent), #00d4ff)',
  flexShrink: 0,
};

// ── Mono font helper ──────────────────────────────────────────────────────────

const mono: CSSProperties = {
  fontFamily: "'DM Mono', monospace",
};

// ── Heading styles ────────────────────────────────────────────────────────────

const pageTitle: CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontWeight: 800,
  fontSize: '1.875rem',
  letterSpacing: '-0.02em',
  color: 'var(--apex-text-primary)',
};

const sectionLabel: CSSProperties = {
  fontSize: '10px',
  fontFamily: "'DM Mono', monospace",
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--apex-text-muted)',
};

// ── Icon containers ───────────────────────────────────────────────────────────

const iconGreen: CSSProperties = {
  background: 'rgba(0,255,135,0.08)',
  border: '1px solid rgba(0,255,135,0.15)',
};

const iconBlue: CSSProperties = {
  background: 'rgba(96,165,250,0.08)',
  border: '1px solid rgba(96,165,250,0.15)',
};

const iconAmber: CSSProperties = {
  background: 'rgba(245,158,11,0.08)',
  border: '1px solid rgba(245,158,11,0.15)',
};

const iconRed: CSSProperties = {
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.15)',
};

const iconPurple: CSSProperties = {
  background: 'rgba(167,139,250,0.08)',
  border: '1px solid rgba(167,139,250,0.15)',
};

// ── Export as named object ────────────────────────────────────────────────────

export const a = {
  // Backgrounds
  card,
  cardGradient,
  input,
  modal,

  // Text
  textPrimary,
  textSecondary,
  textMuted,
  textLabel,
  textAccent,
  textDanger,

  // Label
  label,

  // Dividers
  divider,
  dividerTop,

  // Accent fills
  accentFill,
  dangerFill,

  // Buttons
  btnPrimary,
  btnGhost,
  btnDanger,

  // Decoration
  accentBar,

  // Typography
  mono,
  pageTitle,
  sectionLabel,

  // Icon containers
  iconGreen,
  iconBlue,
  iconAmber,
  iconRed,
  iconPurple,
} as const;

// ── Also export individually for named imports ────────────────────────────────

export {
  card, cardGradient, input, modal,
  textPrimary, textSecondary, textMuted, textLabel, textAccent, textDanger,
  label,
  divider, dividerTop,
  accentFill, dangerFill,
  btnPrimary, btnGhost, btnDanger,
  accentBar,
  mono, pageTitle, sectionLabel,
  iconGreen, iconBlue, iconAmber, iconRed, iconPurple,
};