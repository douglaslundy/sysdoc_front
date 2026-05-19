# TASK_TODO.md - Backlog Atualizado

**Data:** 2026-05-17  
**Status:** Em estabilizacao visual/funcional pos-padronizacao

## P0 - Obrigatorio para producao
- [x] Executar `php artisan migrate --force` no backend publicado
- [x] Executar `php artisan db:seed --class=AccessProfileSeeder --force`
- [ ] Validar variaveis de ambiente criticas (`APP_DEBUG`, `FRONTEND_URL`, cookies, `MAIL_*`)
- [ ] Rodar smoke test de autenticacao e autorizacao (login, logout, refresh, rotas admin)

## P1 - Alta prioridade funcional
- [x] Padronizar layout responsivo de cabecalhos (inputs/botoes) nas telas criticas alteradas
- [x] Corrigir titulo amigavel em portugues no header global por rota
- [x] Corrigir charset UTF-8 em paginas com texto corrompido
- [ ] Validar ponta a ponta modulo de anexos (queue/letter/ordinance): upload, download, delete, permissoes
- [ ] Validar dashboards com base real de dados (fila, tfd, laboratorio, farmacia, vigilancia)
- [ ] Revisar logs de erro para garantir baixa de ruido e captura de falhas reais

## P2 - Qualidade tecnica
- [ ] Adicionar/atualizar testes de feature para anexos e rotas de auditoria
- [ ] Revisar dependencia legacy no frontend e limpar pacotes nao utilizados
- [ ] Documentar fluxo de deploy com checklist padrao

## P3 - Organizacao de contexto
- [ ] Arquivar `TASK_PLAN.md` e `TASK_DECISIONS.md` como historico (fases antigas)
- [ ] Manter `TODO.md`, `TASK_STATE.md` e `HANDOFF.md` como fontes oficiais de status atual
