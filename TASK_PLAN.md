# TASK PLAN - Retomada Rapida (Atualizado em 2026-06-01)

## Objetivo
Aplicar o novo design em todas as telas renderizadas de `sysdoc_front`, preservando funcionalidades.

## Referencias visuais
- `docs/ChatGPT Image 31 de mai. de 2026, 22_49_03.png`
- `docs/ChatGPT Image 31 de mai. de 2026, 22_50_39.png`

## Status atual por onda
1. Onda A: concluida.
- Sidebar, header e dashboard principal refatorados para o novo padrao.
2. Onda B: concluida.
- CRUDs principais e modais administrativos padronizados.
3. Onda C: parcialmente concluida.
- Farmacia, Queue, Letters e Ordinance com padronizacao visual aplicada.
- Restante dos modulos exige ajuste fino visual e QA funcional por fluxo.
4. Onda D: em aberto.
- Pendente QA visual/funcional completo, responsividade final e ajustes pixel a pixel.

## Diretrizes de implementacao
- Usar tokens unicos de cor/sombra/radius/blur/spacing.
- Inputs 48px e modais no padrao global.
- Reutilizar componentes base para evitar `sx` isolado.
- Nao alterar regras de negocio.

## Situacao tecnica atual
- Build: estavel e passando (`npm run build` ok).
- Runtime: sem erros de referencia nas ultimas validacoes.
- Padronizacao: aplicada em layout global, listagens principais e modais criticos.

## QA minimo por onda (pendente de execucao final)
1. Verificar rota por rota (desktop/mobile).
2. Validar estados (loading, vazio, erro, sucesso, focus/hover).
3. Rodar build e corrigir qualquer regressao antes de avancar.

## Criterio de pronto (restante para encerrar)
- QA rota a rota (desktop/mobile) concluido.
- QA funcional completo (CRUD, anexos, PDF/recibo, filtros/paginacao).
- Ajustes finais de consistencia visual entre modulos.
- 0 regressao funcional confirmada em checklist.

## Documento completo
- `docs/design-system-implementation-plan-2026-06-01.md`
