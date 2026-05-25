# CLAUDE.md

## Objetivo principal

Você está trabalhando em um projeto Laravel existente. Sua missão é analisar todo o sistema, identificar todas as funcionalidades reais implementadas, documentar o produto e substituir a página inicial atual por uma landing page comercial, persuasiva, técnica e otimizada para SEO.

A landing page deve divulgar o sistema com base no que o projeto realmente faz, sem inventar funcionalidades não existentes.

Além da landing page, você deve criar um manual de uso completo, em HTML e PDF, explicando todas as funcionalidades identificadas.

## Regras obrigatórias

1. Antes de escrever copy, página, manual ou qualquer material comercial, analise o projeto.
2. Não invente funcionalidades.
3. Toda afirmação sobre o produto deve ser rastreável para rotas, controllers, models, migrations, views, seeders, policies, jobs, services, tests, config ou documentação existente.
4. Quando houver dúvida, registre a dúvida em `.claude/memory/implementation-notes.md`.
5. Preserve o padrão técnico do projeto Laravel.
6. Evite alterações destrutivas.
7. Antes de substituir a página inicial, identifique a rota atual `/`.
8. Se existir autenticação, painel administrativo, dashboard, módulos privados ou perfis de usuário, mapeie isso no inventário de funcionalidades.
9. A landing page deve ser responsiva, acessível e compatível com o stack visual já usado no projeto.
10. O manual deve ser útil para usuário final, não apenas para desenvolvedor.

## Resultado esperado

Ao final, o projeto deve conter:

- Landing page substituindo a página Laravel atual.
- Inventário completo das funcionalidades.
- Manual de uso em HTML.
- Manual de uso em PDF.
- Registro das decisões tomadas.
- Checklist de validação final.
- Arquivos Markdown atualizados em `.claude/memory/`.

## Processo obrigatório

Execute as tarefas na seguinte ordem:

1. `.claude/tasks/00-discover-project.md`
2. `.claude/tasks/01-map-features.md`
3. `.claude/tasks/02-create-product-positioning.md`
4. `.claude/tasks/03-create-landing-page.md`
5. `.claude/tasks/04-create-user-manual.md`
6. `.claude/tasks/05-export-manual-html-pdf.md`
7. `.claude/tasks/06-final-review.md`

## Critérios de qualidade

A solução só estará concluída quando:

- A rota `/` renderizar a nova landing page.
- A página apresentar claramente o que o sistema faz.
- A copy explicar benefícios, funcionalidades, diferenciais e chamadas para ação.
- O conteúdo tiver estrutura SEO adequada.
- O manual cobrir todas as funcionalidades reais identificadas.
- O PDF e o HTML forem gerados corretamente.
- O projeto continuar executando sem erros.
- O código não quebrar autenticação, rotas internas, assets ou layouts existentes.

## Comandos úteis

Use os comandos abaixo quando aplicáveis:

```bash
php artisan route:list
php artisan test
php artisan view:clear
php artisan config:clear
php artisan cache:clear
npm run build
npm run dev
composer install
npm install
```

Não execute comandos destrutivos sem necessidade.
