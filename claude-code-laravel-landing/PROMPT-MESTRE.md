# Prompt mestre para executar no Claude Code

Use este prompt dentro do Claude Code, na raiz do projeto:

```md
Você está em um projeto Laravel existente.

Sua tarefa é executar integralmente o plano definido nos arquivos:

- `CLAUDE.md`
- `AGENTS.md`
- `.claude/context/*.md`
- `.claude/agents/*.md`
- `.claude/tasks/*.md`

Objetivo final:

1. Analisar todo o projeto.
2. Listar tudo que o sistema faz.
3. Criar inventário real de funcionalidades com evidências no código.
4. Criar uma landing page para substituir a página inicial atual do Laravel.
5. A landing page deve divulgar o sistema com copy persuasiva, SEO e informações reais das funcionalidades.
6. Criar um manual de uso completo em Markdown.
7. Exportar o manual em HTML e PDF.
8. Revisar tecnicamente toda a entrega.

Regras obrigatórias:

- Não invente funcionalidades.
- Toda funcionalidade mencionada na landing page ou no manual deve existir no projeto.
- Use evidências do código para sustentar o inventário.
- Preserve o padrão Laravel existente.
- Não quebre autenticação, dashboard, rotas internas, assets ou permissões.
- Não faça alterações destrutivas.
- Atualize os arquivos em `.claude/memory/` conforme avançar.
- Execute as tarefas na ordem definida em `CLAUDE.md`.

Comece pela tarefa:

`.claude/tasks/00-discover-project.md`

Depois siga sequencialmente até:

`.claude/tasks/06-final-review.md`

Ao final, entregue um resumo contendo:

- Funcionalidades identificadas.
- Arquivos alterados.
- Landing page criada.
- Caminho do manual HTML.
- Caminho do manual PDF.
- Testes ou validações executadas.
- Pendências, se houver.
```
