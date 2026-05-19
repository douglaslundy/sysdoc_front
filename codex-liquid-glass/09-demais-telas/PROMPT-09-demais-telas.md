# PROMPT 09 — Aplicação do Tema nas Demais Telas
## Dependência: PROMPT-01 ao 08 concluídos.

---

## Sua tarefa

Com os componentes globais já atualizados (Sidebar, Topbar, formulários,
botões, badges, cards), a maioria das telas já deve estar com o visual
correto por herança de estilos.

Neste prompt, percorra **cada tela** do menu lateral e verifique se há
elementos específicos que ainda não foram cobertos pelos estilos globais.
Para cada tela com problema, aplique os ajustes necessários.

---

## Lista de telas a revisar

Percorra cada item abaixo na ordem:

### 1. Dashboard

Elementos típicos a verificar:
- Cards de métricas / estatísticas → usar `.stat-card` (PROMPT-07)
- Gráficos / Charts → verificar se o container tem o estilo glass
- Tabelas de resumo → verificar se herdam o estilo de tabela (PROMPT-04)

```css
/* Se houver container específico do dashboard */
.dashboard-grid,
[class*="dashboard-container"] {
  display: grid;
  gap: 16px;
}

.dashboard-chart-card {
  background: var(--lg-glass-panel);
  backdrop-filter: var(--lg-blur-panel);
  -webkit-backdrop-filter: var(--lg-blur-panel);
  border: 0.5px solid var(--lg-border);
  border-top: 1px solid var(--lg-border-strong);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--lg-shadow-panel);
}
```

---

### 2. Atendimento → Fila / Em Atendimento / Salas

Elementos típicos:
- Cards de paciente / ticket → usar `.card` (PROMPT-07)
- Status badges → usar `.badge` (PROMPT-07)
- Botões de ação em cada card → usar `.btn-icon` (PROMPT-07)
- Contador / timer → estilo específico:

```css
.attendance-timer,
[class*="timer-display"] {
  font-size: 22px;
  font-weight: 600;
  color: var(--lg-text-primary);
  background: var(--lg-glass-panel);
  border-radius: 10px;
  padding: 8px 16px;
  border: 0.5px solid var(--lg-border);
}
```

---

### 3. Laboratório / Vigilância Sanitária / Farmácia / TFD

Elementos típicos:
- Tabelas de listagem → herdam PROMPT-04
- Formulários de cadastro → herdam PROMPT-06
- Modais de detalhe → herdam PROMPT-05
- Painéis de resultado:

```css
.result-panel,
[class*="result-container"],
[class*="exam-result"] {
  background: var(--lg-glass-panel);
  backdrop-filter: var(--lg-blur-panel);
  -webkit-backdrop-filter: var(--lg-blur-panel);
  border: 0.5px solid var(--lg-border);
  border-radius: 14px;
  padding: 18px;
}
```

---

### 4. Documentos / Relatórios

Elementos típicos:
- Lista de arquivos / documentos:

```css
.document-item,
[class*="file-item"],
[class*="report-item"] {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--lg-glass-panel);
  border: 0.5px solid var(--lg-border-row);
  border-radius: 10px;
  transition: background 0.12s ease;
  cursor: pointer;
  margin-bottom: 6px;
}
.document-item:hover {
  background: var(--lg-glass-row-hover);
}
.document-item__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--lg-text-primary);
}
.document-item__meta {
  font-size: 11px;
  color: var(--lg-text-muted);
}
```

- Filtros de relatório → herdam PROMPT-06 (inputs e selects)
- Botão de exportar:

```css
.btn-export,
[class*="btn-export"],
[class*="btn-download"] {
  background: rgba(var(--lg-accent-rgb), 0.10);
  border: 0.5px solid rgba(var(--lg-accent-rgb), 0.25);
  border-radius: 10px;
  color: var(--lg-accent);
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: background 0.14s ease;
}
.btn-export:hover {
  background: rgba(var(--lg-accent-rgb), 0.18);
}
```

---

### 5. Segurança

Elementos típicos:
- Logs / registros de acesso → usar estilo de tabela (PROMPT-04)
- Painéis de permissão:

```css
.permission-card,
[class*="permission-item"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--lg-glass-panel);
  border: 0.5px solid var(--lg-border-row);
  border-radius: 10px;
  margin-bottom: 6px;
}
.permission-card__label {
  font-size: 13px;
  color: var(--lg-text-primary);
  font-weight: 500;
}
.permission-card__sub {
  font-size: 11px;
  color: var(--lg-text-muted);
  margin-top: 2px;
}
```

---

### 6. Perfis de Acesso / Páginas do Sistema / Categorias

Elementos típicos:
- Listas com ações → herdam tabela (PROMPT-04)
- Formulários de edição → herdam PROMPT-06
- Árvore de permissões:

```css
.permission-tree,
[class*="access-tree"] {
  background: var(--lg-glass-panel);
  border: 0.5px solid var(--lg-border);
  border-radius: 12px;
  padding: 16px;
}
.permission-tree__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--lg-text-secondary);
  transition: background 0.12s ease;
}
.permission-tree__item:hover {
  background: var(--lg-glass-row-hover);
}
```

---

## Elementos transversais a verificar em TODAS as telas

```css
/* Breadcrumbs */
.breadcrumb,
[class*="breadcrumb"] {
  font-size: 12px;
  color: var(--lg-text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}
.breadcrumb__current {
  color: var(--lg-text-secondary);
  font-weight: 500;
}

/* Empty state (lista vazia) */
.empty-state,
[class*="empty-state"],
[class*="no-data"] {
  text-align: center;
  padding: 48px 24px;
  color: var(--lg-text-muted);
}
.empty-state__title {
  font-size: 15px;
  font-weight: 500;
  color: var(--lg-text-secondary);
  margin-bottom: 8px;
}

/* Loading spinner */
.loading,
[class*="loading"],
[class*="spinner"] {
  color: var(--lg-accent);
}

/* Alerts / Notificações toast */
.alert,
[class*="alert"],
[class*="toast"] {
  background: var(--lg-glass-modal);
  backdrop-filter: var(--lg-blur-input);
  -webkit-backdrop-filter: var(--lg-blur-input);
  border: 0.5px solid var(--lg-border);
  border-radius: 12px;
  padding: 14px 18px;
  color: var(--lg-text-primary);
  font-size: 13px;
  box-shadow: var(--lg-shadow-panel);
}
.alert--success { border-left: 3px solid var(--lg-badge-visa-color); }
.alert--error   { border-left: 3px solid var(--lg-danger); }
.alert--info    { border-left: 3px solid var(--lg-accent); }
.alert--warning { border-left: 3px solid #eab308; }

/* Dividers */
hr,
.divider,
[class*="divider"] {
  border: none;
  border-top: 0.5px solid var(--lg-border-row);
  margin: 16px 0;
}

/* Scrollbar global */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(var(--lg-accent-rgb), 0.2);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--lg-accent-rgb), 0.35);
}
```

---

## Checklist de validação por tela

Para cada tela do menu lateral, confirme:

- [ ] Dashboard — cards de métricas e gráficos com glass
- [ ] Usuários — já validado no PROMPT-04
- [ ] Categorias de Páginas — tabela e formulário glass
- [ ] Páginas do Sistema — tabela e formulário glass
- [ ] Perfis de Acesso — árvore de permissões glass
- [ ] Painel — elementos específicos da tela com glass
- [ ] Serviços — tabela e formulário glass
- [ ] Cadastros (submenu) — todas as subtelas glass
- [ ] Atendimento / Fila — cards de chamada glass
- [ ] Em Atendimento — painel principal glass
- [ ] Minha Sala — layout glass
- [ ] Novo Atendimento — formulário glass
- [ ] Salas — listagem glass
- [ ] Laboratório (subtelas) — glass
- [ ] Vigilância Sanitária (subtelas) — glass
- [ ] Farmácia (subtelas) — glass
- [ ] TFD (subtelas) — glass
- [ ] Documentos — listagem de arquivos glass
- [ ] Relatórios — filtros e resultados glass
- [ ] Segurança — logs e permissões glass
- [ ] Toast / alertas — glass em todas as telas
- [ ] Estado vazio (sem dados) — estilo correto
- [ ] Loading / spinner — cor de acento correta
- [ ] Scrollbar personalizada

Quando terminar, confirme e aguarde o prompt final (QA).
