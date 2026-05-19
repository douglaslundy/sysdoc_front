# PROMPT 10 — QA Final e Entrega
## Dependência: PROMPT-00 ao 09 concluídos.

---

## Sua tarefa

Execute a revisão final completa antes de considerar a atualização de layout
encerrada. Este prompt não exige novas implementações — apenas validação,
correções de regressão e documentação dos entregáveis.

---

## 1. Teste de regressão visual

Para cada tela listada abaixo, tire um screenshot e confirme que:
a) O layout está correto visualmente (glass aplicado)
b) Nenhuma funcionalidade foi quebrada (cliques, navegação, formulários)

| Tela | Glass OK | Funcional OK |
|------|----------|--------------|
| Dashboard | ☐ | ☐ |
| Usuários — listagem | ☐ | ☐ |
| Usuários — modal cadastro | ☐ | ☐ |
| Categorias de Páginas | ☐ | ☐ |
| Páginas do Sistema | ☐ | ☐ |
| Perfis de Acesso | ☐ | ☐ |
| Painel | ☐ | ☐ |
| Serviços | ☐ | ☐ |
| Cadastros (subtelas) | ☐ | ☐ |
| Atendimento — Fila | ☐ | ☐ |
| Atendimento — Em Atendimento | ☐ | ☐ |
| Atendimento — Minha Sala | ☐ | ☐ |
| Atendimento — Novo Atendimento | ☐ | ☐ |
| Atendimento — Salas | ☐ | ☐ |
| Laboratório | ☐ | ☐ |
| Vigilância Sanitária | ☐ | ☐ |
| Farmácia | ☐ | ☐ |
| TFD | ☐ | ☐ |
| Documentos | ☐ | ☐ |
| Relatórios | ☐ | ☐ |
| Segurança | ☐ | ☐ |

---

## 2. Checklist técnico

### Variáveis CSS
- [ ] Todas as variáveis `--lg-*` estão definidas para dark e light
- [ ] Nenhuma cor hardcoded foi usada fora do `theme-liquid-glass.css`
- [ ] O prefixo `--lg-` não conflitou com nenhuma variável existente

### Efeito glass
- [ ] `backdrop-filter` visível em pelo menos Chrome, Edge e Safari
- [ ] Fallback `@supports not (backdrop-filter)` está ativo para Firefox sem suporte
- [ ] A borda superior dos painéis principais tem opacidade mais alta (reflexo de luz)

### Tema dark / light
- [ ] Toggle de tema funciona em todas as telas
- [ ] Preferência salva no localStorage persiste após reload
- [ ] Anti-FOUC script no `<head>` está ativo
- [ ] Sistema de media query `prefers-color-scheme` é respeitado no primeiro acesso

### Acessibilidade
- [ ] Contraste de texto ≥ 4.5:1 em ambos os temas (verificar com DevTools)
- [ ] Todos os botões têm `aria-label` quando não têm texto visível
- [ ] Focus ring visível em todos os inputs e botões interativos
- [ ] Nenhum elemento interativo perdeu o foco por causa do backdrop-filter

### Performance
- [ ] `backdrop-filter` aplicado apenas em elementos que precisam (não em todo body)
- [ ] Animações de transição são `transform` e `opacity` (GPU-friendly)
- [ ] Nenhuma imagem desnecessária foi adicionada

---

## 3. Correções comuns de regressão

Se alguma tela apresentar problema, aplique os seguintes ajustes:

### Texto invisível (cor herdada errada)
```css
/* Forçar herança de cor do tema */
.sua-classe { color: var(--lg-text-primary); }
```

### Input com fundo branco sólido em dark
```css
.seu-input {
  background: var(--lg-glass-input) !important;
  color: var(--lg-text-primary) !important;
}
```

### Modal sem overlay blur
```css
.seu-overlay {
  backdrop-filter: var(--lg-blur-overlay) !important;
  -webkit-backdrop-filter: var(--lg-blur-overlay) !important;
}
```

### Sidebar sem efeito glass (fundo sólido)
```css
.sua-sidebar {
  background: var(--lg-glass-sidebar) !important;
  backdrop-filter: var(--lg-blur-sidebar) !important;
  -webkit-backdrop-filter: var(--lg-blur-sidebar) !important;
}
```

### Botão com cor errada em light
```css
[data-theme="light"] .seu-botao {
  /* verificar se está usando variável --lg- ou cor hardcoded */
}
```

---

## 4. Entregáveis finais

Confirme que os seguintes arquivos foram criados ou modificados:

```
src/
├── assets/styles/
│   └── theme-liquid-glass.css      ← NOVO (PROMPT-01)
├── components/
│   ├── Sidebar.*                   ← ATUALIZADO (PROMPT-02)
│   ├── Topbar.*                    ← ATUALIZADO (PROMPT-03)
│   ├── Modal.*                     ← ATUALIZADO (PROMPT-05)
│   ├── Button.*                    ← ATUALIZADO (PROMPT-07)
│   ├── Badge.*                     ← ATUALIZADO (PROMPT-07)
│   ├── Input.*                     ← ATUALIZADO (PROMPT-06)
│   ├── Select.*                    ← ATUALIZADO (PROMPT-06)
│   └── Toggle.*                    ← ATUALIZADO (PROMPT-06)
├── views/
│   └── usuarios/
│       └── Usuarios.*              ← ATUALIZADO (PROMPT-04)
└── [entry point: main.js/ts]      ← ATUALIZADO (importa theme-liquid-glass.css)
```

---

## 5. Screenshots de before / after

Produza screenshots comparativos (antes e depois) de pelo menos estas 3 telas:

1. **Tela de Usuários** — listagem com tabela
2. **Modal de Cadastro** — aberto com campos preenchidos
3. **Dashboard** — com cards de métricas

Inclua uma versão dark e uma versão light de cada.

---

## 6. Notas para o time

Adicione um comentário no topo do `theme-liquid-glass.css`:

```css
/*
 * DL Sistemas — Liquid Glass Theme
 * Versão: 1.0.0
 * Data: [data de hoje]
 * Autor: [nome do desenvolvedor]
 *
 * ATENÇÃO: Não edite as variáveis --lg-* diretamente aqui para customizações
 * específicas de tela. Sobrescreva com seletores mais específicos no CSS
 * do componente.
 *
 * Temas: dark (padrão) | light
 * Controle: atributo data-theme no elemento <html>
 * Persistência: localStorage key 'lg-theme'
 */
```

---

## Confirmação final

Quando toda a tabela de telas estiver preenchida, o checklist técnico
estiver completo e os screenshots estiverem prontos, responda com:

> "Atualização de layout Liquid Glass concluída.
>  X telas atualizadas. Y arquivos modificados. Z arquivos criados.
>  Screenshots disponíveis em: [caminho]"

A tarefa estará oficialmente encerrada.
