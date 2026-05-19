# PROMPT 02 — Componente Sidebar / NavMenu
## Dependência: PROMPT-01 concluído (theme-liquid-glass.css importado e funcionando).

---

## Sua tarefa

Atualize o componente **Sidebar / NavMenu** do projeto para o estilo Liquid Glass.
Use exclusivamente as variáveis `--lg-*` criadas no PROMPT-01.

---

## Resultado visual esperado

- Painel lateral translúcido com efeito de vidro fosco sobre o fundo gradiente
- Logo com ícone quadrado arredondado em gradiente azul→roxo
- Itens de navegação com hover sutil e item ativo destacado por barra lateral colorida
- Separação visual entre grupos de navegação com label de seção em caixa alta

---

## CSS a aplicar no componente Sidebar

```css
/* Container principal da sidebar */
.sidebar,
.nav-menu,
[class*="sidebar"],
[class*="nav-menu"] {
  background: var(--lg-glass-sidebar);
  backdrop-filter: var(--lg-blur-sidebar);
  -webkit-backdrop-filter: var(--lg-blur-sidebar);
  border-right: 0.5px solid var(--lg-border-sidebar);
  position: relative;
  z-index: 10;
}

/* Área do logo */
.sidebar__logo,
.logo-area {
  border-bottom: 0.5px solid var(--lg-border);
  padding: 20px 16px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Ícone do logo */
.sidebar__logo-icon,
.logo-icon {
  background: linear-gradient(135deg, #2563EB, #6D28D9);
  box-shadow: var(--lg-shadow-logo);
  border-radius: 10px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

/* Texto do logo */
.sidebar__logo-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--lg-text-primary);
  line-height: 1.2;
}
.sidebar__logo-sub {
  font-size: 9.5px;
  color: var(--lg-text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Label de seção */
.nav-section__label,
.nav-group-title,
[class*="nav-label"] {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--lg-text-muted);
  text-transform: uppercase;
  padding: 0 8px 6px;
}

/* Item de navegação */
.nav-item,
.nav-link,
[class*="nav-item"],
[class*="sidebar-item"] {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--lg-nav-color);
  cursor: pointer;
  position: relative;
  transition: background 0.14s ease, color 0.14s ease;
}

/* Hover */
.nav-item:hover,
.nav-link:hover {
  background: var(--lg-nav-hover-bg);
  color: var(--lg-text-primary);
}

/* Item ativo */
.nav-item.active,
.nav-item.router-link-active,
.nav-link.active,
[class*="nav-item"].active {
  background: var(--lg-nav-active-bg);
  color: var(--lg-nav-active-color);
  font-weight: 500;
}

/* Barra lateral do item ativo */
.nav-item.active::before,
.nav-link.active::before,
[class*="nav-item"].active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  height: 60%;
  width: 3px;
  background: var(--lg-nav-active-bar);
  border-radius: 0 3px 3px 0;
}

/* Ícone do item de nav */
.nav-item i,
.nav-item svg,
.nav-link i {
  font-size: 16px;
  flex-shrink: 0;
}

/* Chevron de submenu */
.nav-item__chevron,
.nav-chevron {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.35;
}
```

---

## Checklist de validação

Após aplicar, confirme visualmente:

- [ ] Sidebar tem efeito glass (translúcida sobre o fundo)
- [ ] Logo tem gradiente azul→roxo com sombra colorida
- [ ] Item "Usuários" (ou o ativo atual) tem barra lateral azul à esquerda
- [ ] Hover dos itens é sutil (sem fundo branco sólido)
- [ ] Labels de seção estão em maiúsculas pequenas e na cor muted
- [ ] Ícones estão alinhados e no tamanho correto
- [ ] Efeito funciona em dark e light (teste trocando data-theme no DevTools)

Quando terminar, confirme e aguarde o próximo prompt.
