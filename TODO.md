# SYSDOC - TODO MASTER

> Ultima atualizacao: 2026-05-16
> Escopo: backend (`sysdoc_back`) + frontend (`sysdoc_front`)

## Legenda
- [x] Concluido
- [ ] Pendente
- [~] Em andamento

## Estado Atual
- [x] Modulos de laboratorio, auditoria, dashboards, vigilancia (alvaras) e farmacia implementados
- [x] RBAC dinamico por permissoes com guardas no frontend/backend
- [x] Fluxos de anexos em filas/portarias/oficios com confirmacao de exclusao
- [x] Recuperacao de senha e melhoria de UX em telas criticas

## Pendencias Operacionais
- [x] Rodar migrations pendentes em producao: `php artisan migrate --force`
- [x] Reexecutar seed de permissoes/paginas: `php artisan db:seed --class=AccessProfileSeeder --force`
- [ ] Validar `.env` de producao (backend e frontend), principalmente URLs, cookies e mail
- [ ] Executar smoke end-to-end em producao para: login, dashboards, laboratorio, alvaras, farmacia, anexos

## Pendencias Tecnicas Prioritarias
- [ ] Consolidar e reduzir dependencias do frontend (package.json muito inflado para o escopo atual)
- [ ] Revisar throttling/observabilidade dos dashboards com monitoramento real de latencia
- [ ] Cobrir com testes automatizados os fluxos de anexos (upload/download/delete + autorizacao)

## Baixa Prioridade
- [ ] Atualizar documentacao de deploy com checklist por ambiente (dev/hml/prod)
- [ ] Limpar/arquivar documentos historicos de fases antigas (A-O) para reduzir ruido
