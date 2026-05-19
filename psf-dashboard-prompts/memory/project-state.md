# memory/project-state.md — Estado e Decisões do Projeto

## Decisões Tomadas

### Banco de Dados
- Desenvolvimento: PostgreSQL via Docker (`docker compose up -d` em `modules/monitor-aps/docker/`)
- Credenciais dev: host=localhost, porta=5432, banco=esus, user=monitor_aps, senha=monitor123
- Produção: banco real do eSUS PEC na SMS Ilicínea (configurado em `.env.production`)
- Troca entre ambientes: apenas via arquivo `.env` — zero mudança de código
- Backend: Node.js + Express + node-postgres (pg)
- Frontend: React + Recharts + TailwindCSS
- Acesso ao banco: somente-leitura via usuário dedicado `monitor_aps`
- Preferir tabelas DW (fat_, dim_, vw_) sobre tabelas operacionais (tb_)

### Segurança
- NUNCA escrever no banco do eSUS PEC (apenas SELECT)
- Credenciais do banco nunca expostas no frontend
- Configurações salvas no servidor, não no localStorage
- Logs de todas as queries ao banco do PEC para auditoria

### Performance
- Cache de 5 minutos para queries de indicadores (configurável)
- Lazy loading de todos os componentes do módulo no bundle principal
- Queries sempre filtradas por dim_tempo para evitar full scans

## Informações do Ambiente

```
Município: Ilicínea – MG
CNES UBS: 2794454
Portaria Base: GM/MS 3.493/2024 (+ atualizada pela 6.907/2025)
Versão PEC alvo: 5.4+ (DW PEC 7.4.0)
```

## Referências Normativas Usadas

| Item | Referência |
|------|-----------|
| Novo modelo cofinanciamento APS | Portaria GM/MS nº 3.493, de 10/04/2024 |
| Indicadores de qualidade (15) | Portaria GM/MS nº 6.907, de 29/04/2025 |
| Fichas técnicas indicadores | SAPS/MS — maio/2025 |
| Schema DW PEC | integracao.esusaps.bridge.ufsc.tech/dw/ (v7.4.0) |

## Schema DW PEC Confirmado vs. Esperado

> Esta seção deve ser preenchida durante a Task 2.1 (exploração do schema real)

```
Versão PEC instalada: [preencher após conexão]
Tabelas DW encontradas: [preencher após Task 2.1]
Diferenças do schema documentado: [preencher após Task 2.1]
```

## Progresso das Tasks

> Atualizar conforme avança no plano de execução

- [ ] Fase 1: Fundação
  - [ ] 1.1 Setup do projeto
  - [ ] 1.2 Serviço de conexão
  - [ ] 1.3 Endpoints de configuração
  - [ ] 1.4 Script SQL de setup

- [ ] Fase 2: Serviços de Indicadores
  - [ ] 2.1 Exploração do schema DW
  - [ ] 2.2 Serviço de Vínculo
  - [ ] 2.3 Qualidade eSF/eAP (indicadores 1-10)
  - [ ] 2.4 Qualidade eSB (indicadores 13-15)
  - [ ] 2.5 Classificação e Repasse
  - [ ] 2.6 Rotas da API

- [ ] Fase 3: Frontend
  - [ ] 3.1 Setup frontend do módulo
  - [ ] 3.2 Serviço API frontend
  - [ ] 3.3 Componentes reutilizáveis
  - [ ] 3.4 Dashboard Principal
  - [ ] 3.5 Vínculo Territorial
  - [ ] 3.6 Indicadores de Qualidade
  - [ ] 3.7 Por Equipe
  - [ ] 3.8 Configurações

- [ ] Fase 4: Integração
  - [ ] 4.1 Backend ao sistema existente
  - [ ] 4.2 Menu de navegação
  - [ ] 4.3 Rotas frontend
  - [ ] 4.4 Variáveis e documentação

- [ ] Fase 5: Testes
  - [ ] 5.1 Teste end-to-end
  - [ ] 5.2 Validação dos thresholds
  - [ ] 5.3 Documentação final
