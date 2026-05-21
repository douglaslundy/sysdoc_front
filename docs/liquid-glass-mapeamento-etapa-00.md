# Mapeamento Etapa 00 - Liquid Glass

Data: 2026-05-16
Projeto alvo: `sysdoc_front` (Next.js + MUI)

## Framework e estilo
- Framework: Next.js (React)
- UI: Material UI (MUI v5 com componentes legados)
- Estilizacao atual: CSS global (`styles/style.css`) + `sx`/styled do MUI + temas MUI (`src/theme/*`)

## Arquivos mapeados
- App shell/layout: `src/layouts/FullLayout.js`
- Sidebar/NavMenu: `src/layouts/sidebar/Sidebar.js`, `src/layouts/sidebar/MenuItems.js`
- Topbar/Header: `src/layouts/header/Header.js`, `src/layouts/header/ProfileDD.js`
- Tela usuarios listagem: `pages/users.js`, `src/components/users/index.js`
- Modal cadastro usuario: `src/components/modal/user/index.js`
- Inputs/Select/Toggle base: MUI `TextField`, `Select`, `Switch` (uso transversal em modais e formularios)
- Tema global: `src/contexts/ThemeContext.js`, `src/theme/theme.js`, `src/theme/darkTheme.js`
- Entry point: `pages/_app.js`

## Observacoes para proxima etapa
- A base de toggle de tema ja existe via `ThemeContext`, com persistencia em `localStorage`.
- Etapa 01 deve criar arquivo global de tokens CSS e importar em `_app.js` apos `styles/style.css`.
- O atributo `data-theme` sera controlado globalmente para suportar tokens `--lg-*`.
