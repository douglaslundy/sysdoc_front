# TODO — Monitor APS

Atualizado em: 2026-05-19 (Fases 4 e 5 concluídas)

## ✅ Concluído

- [x] Task 0 — Docker setup (PostgreSQL dev, schema DW, seed 300 cidadãos)
- [x] Task 1.1 — Setup do projeto backend (package.json, estrutura de dirs)
- [x] Task 1.2 — Serviço de conexão ao banco (database.js, pool, testConnection)
- [x] Task 2.1 — Exploração do schema DW + context/esus-pec-database.md

## 🔄 Em progresso

- [x] Task 1.3 — Endpoints de configuração (config.routes.js, routes/index.js)
- [x] Task 1.4 — Script SQL setup usuário readonly (docs/setup-readonly-user.sql)

## ⏳ Pendente

### FASE 2 — Serviços de Indicadores
- [x] Task 2.2 — vinculo.service.js
- [x] Task 2.3 — qualidade-esf.service.js (indicadores 1-10)
- [x] Task 2.4 — qualidade-esb.service.js (indicadores 13-15)
- [x] Task 2.5 — classificacao.service.js (thresholds + repasse estimado)
- [x] Task 2.6 — indicadores.routes.js + utils/cache.js

### FASE 3 — Frontend
- [x] Task 3.1 — Setup frontend (package.json, estrutura de dirs)
- [x] Task 3.2 — monitorApsApi.js
- [x] Task 3.3 — ClassificacaoBadge, ProgressIndicador, GaugeChart, AlertaBloqueio, ExportButton, IndicadorCard
- [x] Task 3.4 — Dashboard.jsx (ScoreCards, HeatmapTable, PieChart, AlertaPanel, Repasse)
- [x] Task 3.5 — VinculoTerritorial.jsx (cadastros, grupos prioritários, tabela equipes)
- [x] Task 3.6 — IndicadoresQualidade.jsx (grid de cards, filtros, modal detalhes)
- [x] Task 3.7 — PorEquipe.jsx (RadarChart, histórico, tabela)
- [x] Task 3.8 — Configuracoes.jsx (conexão, município, equipes, SQL)

### FASE 4 — Integração
- [x] Task 4.1 — Integração rotas backend ao sistema existente (proxy rewrites em next.config.js)
- [x] Task 4.2 — Integração menu de navegação (sysdoc_front sidebar)
- [x] Task 4.3 — Integração rotas React (lazy loading via next/dynamic)
- [x] Task 4.4 — .env.example + README do módulo

### FASE 5 — Documentação
- [x] Task 5.3 — docs/INDICADORES.md com todos os 15 indicadores

## 🔧 Correções aplicadas (2026-05-19)

- [x] Fix segurança: server.js agora faz bind em `127.0.0.1` (não mais `0.0.0.0`)
- [x] Fix bug ESB: `_semDados` retorna `null` em vez de classificação 'otimo' falsa
- [x] Fix env: `MONITOR_APS_BACKEND_URL` adicionado ao `sysdoc_front/.env`
- [x] Fix README: removidas referências a recharts e Vite (frontend é sysdoc_front)

## ⏳ Pendente (manual)

- [ ] Task 5.1 — Teste end-to-end: subir Docker dev + backend + sysdoc_front e navegar em todas as rotas `/monitor-aps/*`
- [ ] Task 5.2 — Verificar thresholds em `classificacao.service.js` contra fichas técnicas oficiais do MS (Portaria 6.907/2025)
