# PROMPT 00 — Contexto do Projeto
## Entregar este arquivo PRIMEIRO, antes de qualquer outro.

---

## Sua tarefa

Você vai realizar uma **atualização visual completa** do sistema DL Sistemas.
Esta é uma refatoração de layout — o objetivo é modernizar a aparência para o
estilo **Liquid Glass**, mantendo toda a lógica de negócio, rotas, APIs e
funcionalidades intactas.

---

## O que é o DL Sistemas

Aplicação web de gestão municipal de saúde pública com as seguintes seções:

- Dashboard
- Administração (Usuários, Categorias de Páginas, Páginas do Sistema, Perfis de Acesso, Painel, Serviços)
- Cadastros
- Atendimento (Fila, Em Atendimento, Minha Sala, Novo Atendimento, Salas)
- Laboratório
- Vigilância Sanitária
- Farmácia
- TFD
- Documentos
- Relatórios
- Segurança

---

## Regras inegociáveis — leia antes de qualquer coisa

1. **Não altere nenhuma lógica JS/TS** — sem tocar em stores, services,
   APIs, rotas, validações, controllers ou qualquer arquivo que não seja
   de estilização ou template visual.

2. **Não renomeie classes CSS existentes** — apenas sobrescreva propriedades
   visuais (color, background, border, box-shadow, backdrop-filter,
   border-radius) via variáveis ou seletores adicionais.

3. **Não altere estrutura HTML/JSX/Template** — apenas adicione classes
   auxiliares de tema se estritamente necessário.

4. **Prefixe todas as novas variáveis CSS** com `--lg-` (liquid glass) para
   não colidir com variáveis existentes no projeto.

5. **Mantenha fallback** para browsers sem suporte a `backdrop-filter`:

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-panel {
    background: rgba(15, 25, 60, 0.92);
  }
  [data-theme="light"] .glass-panel {
    background: rgba(240, 248, 255, 0.95);
  }
}
```

6. O sistema terá **dois temas**: `dark` e `light`, controlados pelo
   atributo `data-theme="dark|light"` no elemento `<html>` ou `<body>`.

7. Antes de implementar qualquer etapa, **identifique os arquivos reais**
   do projeto que correspondem aos componentes descritos nos prompts
   (Sidebar, Topbar, Modal, etc.) e confirme os nomes encontrados.

---

## O que você deve fazer agora

1. Explore a estrutura de pastas do projeto
2. Identifique o framework utilizado (React / Vue / Angular / outro)
3. Identifique o sistema de estilização (CSS Modules / SCSS / Tailwind /
   styled-components / outro)
4. Liste os arquivos dos componentes globais:
   - Layout / AppShell
   - Sidebar / NavMenu
   - Topbar / Header
   - Modal / Dialog
   - Button, Input, Select, Toggle, Badge
5. Confirme este mapeamento antes de prosseguir

**Não implemente nada ainda. Apenas mapeie e confirme.**

Quando terminar, responda com o mapeamento encontrado e aguarde
o próximo prompt.
