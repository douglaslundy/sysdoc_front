# PROMPT 01 — Tokens CSS Globais (theme.css)
## Dependência: PROMPT-00 concluído e mapeamento confirmado.

---

## Sua tarefa

Crie o arquivo de variáveis CSS globais do tema Liquid Glass.
Este arquivo é a base de todos os outros prompts — sem ele nada funciona.

---

## Onde criar o arquivo

Crie em um local acessível globalmente no projeto. Exemplos:
- `src/assets/styles/theme-liquid-glass.css`
- `src/styles/theme-liquid-glass.css`
- `public/css/theme-liquid-glass.css`

Use o caminho que faz mais sentido para a estrutura já existente.
Importe este arquivo no entry point principal do projeto
(`main.js`, `main.ts`, `index.js`, `App.vue`, `_app.tsx`, etc.)
**após** os estilos globais existentes, nunca antes.

---

## Conteúdo do arquivo

```css
/* ============================================================
   DL Sistemas — Liquid Glass Theme
   Variáveis globais — dark e light
   Prefixo: --lg-  (nunca conflita com variáveis existentes)
   ============================================================ */

/* ── DARK THEME ─────────────────────────────────────────── */
[data-theme="dark"] {

  /* Fundo da aplicação */
  --lg-bg-app-from:       #0d1b3e;
  --lg-bg-app-mid1:       #0a2340;
  --lg-bg-app-mid2:       #0d1a35;
  --lg-bg-app-to:         #111827;

  /* Superfícies glass */
  --lg-glass-panel:       rgba(255,255,255,0.055);
  --lg-glass-panel-hover: rgba(255,255,255,0.085);
  --lg-glass-sidebar:     rgba(255,255,255,0.055);
  --lg-glass-topbar:      rgba(255,255,255,0.04);
  --lg-glass-modal:       rgba(18,30,60,0.85);
  --lg-glass-input:       rgba(255,255,255,0.07);
  --lg-glass-input-focus: rgba(255,255,255,0.10);
  --lg-glass-chip:        rgba(255,255,255,0.07);
  --lg-glass-row-hover:   rgba(255,255,255,0.06);
  --lg-glass-table-head:  rgba(255,255,255,0.04);

  /* Bordas */
  --lg-border:            rgba(255,255,255,0.18);
  --lg-border-strong:     rgba(255,255,255,0.28);
  --lg-border-input:      rgba(255,255,255,0.15);
  --lg-border-input-focus:rgba(79,142,247,0.5);
  --lg-border-row:        rgba(255,255,255,0.05);
  --lg-border-sidebar:    rgba(255,255,255,0.18);

  /* Blur */
  --lg-blur-panel:        blur(20px) saturate(1.3);
  --lg-blur-sidebar:      blur(24px) saturate(1.4);
  --lg-blur-topbar:       blur(20px);
  --lg-blur-modal:        blur(32px) saturate(1.6);
  --lg-blur-input:        blur(12px);
  --lg-blur-overlay:      blur(6px);

  /* Sombras */
  --lg-shadow-panel:      0 8px 32px rgba(0,0,0,0.35),
                          0 1.5px 0 rgba(255,255,255,0.12) inset;
  --lg-shadow-modal:      0 24px 80px rgba(0,0,0,0.6),
                          0 1px 0 rgba(255,255,255,0.15) inset;
  --lg-shadow-btn:        0 4px 16px rgba(79,142,247,0.4);
  --lg-shadow-btn-hover:  0 6px 20px rgba(79,142,247,0.5);
  --lg-shadow-logo:       0 4px 12px rgba(79,142,247,0.4);
  --lg-shadow-avatar:     0 2px 8px rgba(0,0,0,0.12);

  /* Overlay do modal */
  --lg-overlay-bg:        rgba(5,12,30,0.7);

  /* Tipografia */
  --lg-text-primary:      #F0F4FF;
  --lg-text-secondary:    rgba(220,230,255,0.6);
  --lg-text-muted:        rgba(200,215,255,0.4);
  --lg-text-accent:       #6BA3FF;
  --lg-text-danger:       #FF7E82;

  /* Acento */
  --lg-accent:            #4F8EF7;
  --lg-accent-hover:      #6BA3FF;
  --lg-accent-rgb:        79,142,247;

  /* Perigo */
  --lg-danger:            #F7545A;
  --lg-danger-hover:      #FF7E82;
  --lg-danger-rgb:        247,84,90;

  /* Nav ativo */
  --lg-nav-active-bg:     rgba(79,142,247,0.18);
  --lg-nav-active-color:  #6BA3FF;
  --lg-nav-active-bar:    #4F8EF7;
  --lg-nav-color:         rgba(220,230,255,0.6);
  --lg-nav-hover-bg:      rgba(255,255,255,0.08);

  /* Badge USER */
  --lg-badge-user-bg:     rgba(79,142,247,0.18);
  --lg-badge-user-color:  #6BA3FF;

  /* Badge DRIVER */
  --lg-badge-driver-bg:   rgba(120,80,220,0.2);
  --lg-badge-driver-color:#A97EFF;

  /* Badge VISA */
  --lg-badge-visa-bg:     rgba(34,197,100,0.18);
  --lg-badge-visa-color:  #4ADE80;

  /* Toggle */
  --lg-toggle-off:        rgba(255,255,255,0.15);
  --lg-toggle-on:         linear-gradient(90deg, #4F8EF7, #7B5EFF);

  /* Focus ring */
  --lg-focus-ring:        0 0 0 3px rgba(79,142,247,0.12);
}

/* ── LIGHT THEME ─────────────────────────────────────────── */
[data-theme="light"] {

  /* Fundo da aplicação */
  --lg-bg-app-from:       #C7DCFF;
  --lg-bg-app-mid1:       #D4E8FF;
  --lg-bg-app-mid2:       #E0EEFF;
  --lg-bg-app-to:         #D8EAFF;

  /* Superfícies glass */
  --lg-glass-panel:       rgba(255,255,255,0.52);
  --lg-glass-panel-hover: rgba(255,255,255,0.68);
  --lg-glass-sidebar:     rgba(255,255,255,0.52);
  --lg-glass-topbar:      rgba(255,255,255,0.48);
  --lg-glass-modal:       rgba(255,255,255,0.78);
  --lg-glass-input:       rgba(255,255,255,0.65);
  --lg-glass-input-focus: rgba(255,255,255,0.82);
  --lg-glass-chip:        rgba(255,255,255,0.70);
  --lg-glass-row-hover:   rgba(255,255,255,0.55);
  --lg-glass-table-head:  rgba(239,246,255,0.6);

  /* Bordas */
  --lg-border:            rgba(255,255,255,0.92);
  --lg-border-strong:     rgba(255,255,255,0.98);
  --lg-border-input:      rgba(180,210,255,0.5);
  --lg-border-input-focus:rgba(37,99,235,0.4);
  --lg-border-row:        rgba(180,210,255,0.22);
  --lg-border-sidebar:    rgba(255,255,255,0.85);

  /* Blur */
  --lg-blur-panel:        blur(24px) saturate(1.6) brightness(1.02);
  --lg-blur-sidebar:      blur(28px) saturate(1.8) brightness(1.05);
  --lg-blur-topbar:       blur(24px) saturate(1.6);
  --lg-blur-modal:        blur(32px) saturate(2) brightness(1.04);
  --lg-blur-input:        blur(16px);
  --lg-blur-overlay:      blur(6px);

  /* Sombras */
  --lg-shadow-panel:      0 4px 24px rgba(37,99,235,0.08),
                          0 1px 0 rgba(255,255,255,0.9) inset;
  --lg-shadow-modal:      0 20px 60px rgba(37,99,235,0.14),
                          0 1px 0 rgba(255,255,255,0.95) inset;
  --lg-shadow-btn:        0 3px 12px rgba(37,99,235,0.35),
                          0 1px 0 rgba(255,255,255,0.25) inset;
  --lg-shadow-btn-hover:  0 5px 18px rgba(37,99,235,0.45);
  --lg-shadow-logo:       0 2px 10px rgba(37,99,235,0.35),
                          0 0 0 1px rgba(255,255,255,0.6) inset;
  --lg-shadow-avatar:     0 2px 8px rgba(0,0,0,0.12);

  /* Overlay do modal */
  --lg-overlay-bg:        rgba(186,210,255,0.45);

  /* Tipografia */
  --lg-text-primary:      #0F172A;
  --lg-text-secondary:    #475569;
  --lg-text-muted:        #94A3B8;
  --lg-text-accent:       #1D4ED8;
  --lg-text-danger:       #B91C1C;

  /* Acento */
  --lg-accent:            #2563EB;
  --lg-accent-hover:      #1D4ED8;
  --lg-accent-rgb:        37,99,235;

  /* Perigo */
  --lg-danger:            #DC2626;
  --lg-danger-hover:      #B91C1C;
  --lg-danger-rgb:        220,38,38;

  /* Nav ativo */
  --lg-nav-active-bg:     rgba(37,99,235,0.1);
  --lg-nav-active-color:  #1D4ED8;
  --lg-nav-active-bar:    #2563EB;
  --lg-nav-color:         #475569;
  --lg-nav-hover-bg:      rgba(255,255,255,0.7);

  /* Badge USER */
  --lg-badge-user-bg:     #EFF6FF;
  --lg-badge-user-color:  #1D4ED8;

  /* Badge DRIVER */
  --lg-badge-driver-bg:   #F5F3FF;
  --lg-badge-driver-color:#5B21B6;

  /* Badge VISA */
  --lg-badge-visa-bg:     #ECFDF5;
  --lg-badge-visa-color:  #065F46;

  /* Toggle */
  --lg-toggle-off:        #CBD5E1;
  --lg-toggle-on:         linear-gradient(90deg, #2563EB, #7C3AED);

  /* Focus ring */
  --lg-focus-ring:        0 0 0 3px rgba(37,99,235,0.1),
                          0 1px 0 rgba(255,255,255,0.9) inset;
}

/* ── ESTILOS BASE (aplicados em ambos os temas) ──────────── */

/* App Shell — fundo gradiente */
.lg-app-shell,
body,
#app,
.app-wrapper {
  background: linear-gradient(
    135deg,
    var(--lg-bg-app-from) 0%,
    var(--lg-bg-app-mid1) 30%,
    var(--lg-bg-app-mid2) 60%,
    var(--lg-bg-app-to)   100%
  );
  min-height: 100vh;
  position: relative;
}

/* Botão primário global */
.lg-btn-primary {
  background: linear-gradient(135deg, var(--lg-accent), #6D28D9);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  box-shadow: var(--lg-shadow-btn);
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}
.lg-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--lg-shadow-btn-hover);
}

/* Logo icon */
.lg-logo-icon {
  background: linear-gradient(135deg, #2563EB, #6D28D9);
  box-shadow: var(--lg-shadow-logo);
  border-radius: 10px;
}

/* Fallback para browsers sem backdrop-filter */
@supports not (backdrop-filter: blur(1px)) {
  .lg-glass-panel  { background: rgba(15, 25, 60, 0.92) !important; }
  .lg-glass-sidebar { background: rgba(12, 20, 50, 0.95) !important; }
  .lg-glass-modal  { background: rgba(10, 18, 45, 0.97) !important; }
  [data-theme="light"] .lg-glass-panel   { background: rgba(240, 248, 255, 0.95) !important; }
  [data-theme="light"] .lg-glass-sidebar { background: rgba(235, 245, 255, 0.97) !important; }
  [data-theme="light"] .lg-glass-modal   { background: rgba(255, 255, 255, 0.98) !important; }
}
```

---

## Após criar o arquivo

1. Importe-o no entry point do projeto
2. Adicione `data-theme="dark"` no elemento `<html>` ou `<body>` como padrão
3. Confirme que não há erros de compilação
4. Confirme que as variáveis `--lg-*` estão acessíveis no browser
   (DevTools → Computed → procurar por `--lg-text-primary`)

**Não altere nenhum componente ainda. Apenas crie e importe o arquivo.**

Quando terminar, confirme e aguarde o próximo prompt.
