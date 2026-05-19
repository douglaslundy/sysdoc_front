# PROMPT 03 — Componente Topbar / Header
## Dependência: PROMPT-01 e PROMPT-02 concluídos.

---

## Sua tarefa

Atualize o componente **Topbar / Header** para o estilo Liquid Glass.
Use exclusivamente as variáveis `--lg-*`.

---

## Resultado visual esperado

- Barra superior translúcida com reflexo de luz na borda inferior
- Título da página atual em fonte clara e peso médio
- Chip do usuário logado: avatar circular com gradiente + nome + chevron,
  tudo encapsulado em pílula de vidro

---

## CSS a aplicar no Topbar

```css
/* Container do Topbar */
.topbar,
.header,
[class*="topbar"],
[class*="header"]:not(h1):not(h2):not(h3) {
  background: var(--lg-glass-topbar);
  backdrop-filter: var(--lg-blur-topbar);
  -webkit-backdrop-filter: var(--lg-blur-topbar);
  border-bottom: 0.5px solid var(--lg-border);
  box-shadow: 0 1px 0 rgba(255,255,255,0.12) inset;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 22px;
  flex-shrink: 0;
  position: relative;
  z-index: 9;
}

/* Título da página */
.topbar__title,
.page-title,
.header__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--lg-text-primary);
  letter-spacing: -0.01em;
}

/* Chip do usuário logado */
.topbar__user-chip,
.user-chip,
.avatar-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 5px;
  background: var(--lg-glass-chip);
  border: 0.5px solid var(--lg-border);
  border-radius: 40px;
  backdrop-filter: var(--lg-blur-input);
  -webkit-backdrop-filter: var(--lg-blur-input);
  cursor: pointer;
  font-size: 12px;
  color: var(--lg-text-secondary);
  box-shadow: 0 1px 4px rgba(var(--lg-accent-rgb), 0.1),
              0 1px 0 rgba(255,255,255,0.2) inset;
  transition: background 0.14s ease;
}
.topbar__user-chip:hover {
  background: var(--lg-glass-panel-hover);
}

/* Avatar circular dentro do chip */
.topbar__avatar,
.user-avatar-circle,
.avatar-circle {
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #2563EB, #7C3AED);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
}

/* Chevron do chip */
.topbar__user-chip i.ti-chevron-down,
.user-chip .chevron {
  font-size: 12px;
  opacity: 0.4;
}
```

---

## Ajuste de sombra inset por tema

No Light, a sombra inset do topbar é mais visível. Adicione:

```css
[data-theme="light"] .topbar,
[data-theme="light"] .header {
  box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset;
}
```

---

## Checklist de validação

- [ ] Topbar é translúcido (vidro sobre o fundo)
- [ ] Título da página está em `--lg-text-primary`
- [ ] Chip do usuário está visível com avatar circular gradiente
- [ ] Chip tem borda sutil e efeito glass
- [ ] Funciona em dark e light corretamente

Quando terminar, confirme e aguarde o próximo prompt.
