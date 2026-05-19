# TODO de Retomada — Módulo de Atendimento

Data de referência: 2026-05-19

## Contexto salvo

- Módulo de atendimento implementado no backend e frontend.
- Painel público ativo em `/attendance/panel` com polling configurável.
- Proteção de concorrência aplicada na chamada de senha (transação + lock + update atômico por status).
- Testes do módulo de atendimento criados e passando isoladamente.
- Regra operacional acordada: **1 commit por tarefa concluída** e **nunca fazer push**.

## Estado atual dos projetos

- `sysdoc_back`: working tree limpa.
- `sysdoc_front`: working tree limpa.

## Commits locais relevantes (sem push)

- `sysdoc_back`
  - `cd7ba56` Implementa modulo de atendimento: dados, servicos e endpoints
  - `d2f0428` Adiciona endpoint de salas do modulo de atendimento
  - `9c06525` Reforca concorrencia na chamada de senha com update atomico por status
  - `c8a8509` Adiciona testes minimos do modulo de atendimento
- `sysdoc_front`
  - `0ef8eb9` Cria telas iniciais de atendimento e integra menu
  - `3f5023f` Libera attendance/panel como rota publica no middleware
  - `ec7da1d` Libera attendance/panel como rota publica no app
  - `052e670` Refina telas de atendimento com selecao de cliente/sala e painel TV
  - `0e84e70` Implementa polling configuravel no painel de atendimento
  - `0c44dcc` Alinha AuthContext para rota publica attendance/panel

## Pendências principais para próxima sessão

1. Estabilizar suíte global do backend (`php artisan test`) fora do módulo de atendimento.
2. Corrigir falhas de `PharmacyModuleTest` (profile length, encoding e pré-condições de catálogo).
3. Corrigir intermitências/estado de banco de testes em testes unitários/feature legados.
4. Reduzir débito técnico de formatação (`vendor/bin/pint --test`) em ondas.

## Plano rápido de retomada (ordem sugerida)

1. Reproduzir baseline:
   - `php artisan test`
   - `vendor/bin/pint --test`
2. Corrigir primeiro os testes quebrados por maior impacto:
   - `tests/Feature/PharmacyModuleTest.php`
   - `tests/Unit/AlvaraNumberServiceTest.php`
3. Validar novamente:
   - `php artisan test`
4. Atacar lint em ondas:
   - `vendor/bin/pint --test` -> corrigir por conjuntos de arquivos
5. Fechar com validações finais:
   - `php artisan test`
   - `npm run build` (`sysdoc_front`)
   - `npm run production` (`sysdoc_back`) observando erro de `node-notifier` no ambiente

## Checklist de retomada

- [ ] Confirmar branch de trabalho antes de seguir
- [ ] Rodar baseline de testes/lint
- [ ] Corrigir falhas de testes globais
- [ ] Corrigir lint por ondas
- [ ] Revalidar módulo de atendimento isolado
- [ ] Registrar commit por tarefa (sem push)

