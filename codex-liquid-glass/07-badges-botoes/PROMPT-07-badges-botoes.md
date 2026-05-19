# PROMPT 07 — Badges, Botões e Componentes Utilitários
## Dependência: PROMPT-01 ao 06 concluídos.

---

## Sua tarefa

Atualize todos os componentes utilitários reutilizáveis do projeto:
Badge / Chip, Button (todas as variantes), IconButton e Card genérico.
Estes são usados em múltiplas telas.

---

## 1. Botões (todas as variantes)

### Primário (ação principal)

```css
.btn,
.button,
[class*="btn-primary"],
[class*="button-primary"] {
  background: linear-gradient(135deg, var(--lg-accent), #6D28D9);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  padding: 11px 20px;
  cursor: pointer;
  box-shadow: var(--lg-shadow-btn);
  transition: opacity 0.14s ease, transform 0.14s ease, box-shadow 0.14s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn:hover,
[class*="btn-primary"]:hover {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: var(--lg-shadow-btn-hover);
}
.btn:active,
[class*="btn-primary"]:active {
  transform: scale(0.98);
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
```

### Secundário (ação auxiliar)

```css
.btn-secondary,
[class*="btn-secondary"],
[class*="button-secondary"] {
  background: var(--lg-glass-input);
  border: 0.5px solid var(--lg-border-input);
  border-radius: 10px;
  color: var(--lg-text-secondary);
  font-size: 14px;
  padding: 11px 20px;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-secondary:hover,
[class*="btn-secondary"]:hover {
  background: var(--lg-glass-input-focus);
  color: var(--lg-text-primary);
}
```

### Perigo / Destrutivo

```css
.btn-danger,
[class*="btn-danger"],
[class*="button-danger"],
[class*="btn-delete"] {
  background: rgba(var(--lg-danger-rgb), 0.12);
  border: 0.5px solid rgba(var(--lg-danger-rgb), 0.3);
  border-radius: 10px;
  color: var(--lg-danger);
  font-size: 14px;
  padding: 11px 20px;
  cursor: pointer;
  transition: background 0.14s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-danger:hover {
  background: rgba(var(--lg-danger-rgb), 0.22);
}
```

### Ghost / Outline

```css
.btn-ghost,
[class*="btn-ghost"],
[class*="btn-outline"] {
  background: transparent;
  border: 0.5px solid var(--lg-border);
  border-radius: 10px;
  color: var(--lg-text-secondary);
  font-size: 14px;
  padding: 11px 20px;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}
.btn-ghost:hover {
  background: var(--lg-glass-input);
  color: var(--lg-text-primary);
}
```

---

## 2. IconButton (botão apenas com ícone)

```css
.btn-icon,
[class*="icon-button"],
[class*="btn-icon"] {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 0.5px solid;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.12s ease, transform 0.12s ease;
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}
.btn-icon:hover { transform: scale(1.07); }

/* Variante padrão */
.btn-icon--default {
  background: var(--lg-glass-input);
  border-color: var(--lg-border-input);
  color: var(--lg-text-secondary);
}
.btn-icon--default:hover {
  background: var(--lg-glass-input-focus);
  color: var(--lg-text-primary);
}

/* Variante acento (editar, visualizar) */
.btn-icon--accent {
  background: rgba(var(--lg-accent-rgb), 0.08);
  border-color: rgba(var(--lg-accent-rgb), 0.22);
  color: var(--lg-accent);
}
.btn-icon--accent:hover {
  background: rgba(var(--lg-accent-rgb), 0.18);
}

/* Variante perigo (excluir) */
.btn-icon--danger {
  background: rgba(var(--lg-danger-rgb), 0.07);
  border-color: rgba(var(--lg-danger-rgb), 0.22);
  color: var(--lg-danger);
}
.btn-icon--danger:hover {
  background: rgba(var(--lg-danger-rgb), 0.16);
}
```

---

## 3. Badges / Chips

```css
/* Base */
.badge,
.chip,
[class*="badge"],
[class*="chip"] {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 5px;
  letter-spacing: 0.05em;
  line-height: 1.5;
}

/* Variantes semânticas */
.badge--success, [class*="badge-success"] {
  background: var(--lg-badge-visa-bg);
  color: var(--lg-badge-visa-color);
}
.badge--info, [class*="badge-info"] {
  background: var(--lg-badge-user-bg);
  color: var(--lg-badge-user-color);
}
.badge--purple, [class*="badge-purple"] {
  background: var(--lg-badge-driver-bg);
  color: var(--lg-badge-driver-color);
}
.badge--danger, [class*="badge-danger"] {
  background: rgba(var(--lg-danger-rgb), 0.1);
  color: var(--lg-danger);
}
.badge--warning {
  background: rgba(234,179,8,0.12);
  color: #854d0e;
}
[data-theme="dark"] .badge--warning {
  background: rgba(234,179,8,0.15);
  color: #fbbf24;
}
```

---

## 4. Card genérico

```css
.card,
[class*="card-container"],
[class*="info-card"] {
  background: var(--lg-glass-panel);
  backdrop-filter: var(--lg-blur-panel);
  -webkit-backdrop-filter: var(--lg-blur-panel);
  border: 0.5px solid var(--lg-border);
  border-top: 1px solid var(--lg-border-strong);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--lg-shadow-panel);
}

.card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--lg-text-primary);
  margin-bottom: 4px;
}
.card__subtitle {
  font-size: 12px;
  color: var(--lg-text-muted);
}
.card__divider {
  border: none;
  border-top: 0.5px solid var(--lg-border-row);
  margin: 16px 0;
}
```

---

## 5. Stat Card (cards de métricas numéricas)

```css
.stat-card,
[class*="metric-card"],
[class*="stat-card"] {
  background: var(--lg-glass-panel);
  backdrop-filter: var(--lg-blur-panel);
  -webkit-backdrop-filter: var(--lg-blur-panel);
  border: 0.5px solid var(--lg-border);
  border-radius: 12px;
  padding: 16px;
}
.stat-card__label {
  font-size: 11px;
  color: var(--lg-text-muted);
  margin-bottom: 6px;
}
.stat-card__value {
  font-size: 24px;
  font-weight: 600;
  color: var(--lg-text-primary);
}
```

---

## Checklist de validação

- [ ] Botão primário tem gradiente azul→roxo e sombra colorida
- [ ] Botão secundário tem fundo glass
- [ ] Botão danger tem tint vermelho
- [ ] IconButton accent (azul) e danger (vermelho) corretos
- [ ] Badges com cores corretas por variante
- [ ] Cards com efeito glass e borda superior reflexo
- [ ] Todos os estados (hover, active, disabled) funcionando
- [ ] Funciona em dark e light

Quando terminar, confirme e aguarde o próximo prompt.
