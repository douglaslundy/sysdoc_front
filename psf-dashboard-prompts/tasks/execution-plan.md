# tasks/execution-plan.md — Plano de Execução das Tasks

## Ordem de Execução (Sequencial)

Execute as tasks na ordem listada. Cada task depende das anteriores.

---

## FASE 1: Fundação (Banco de Dados e API)

### Task 1.1 — Setup do Projeto
```
Contexto: Você está criando o módulo Monitor APS dentro de um sistema existente.
Ação: Criar a estrutura de diretórios do módulo conforme especificado em CLAUDE.md.
Instalar dependências: pg (ou psycopg2), express (se não existir).
Criar o arquivo package.json do módulo backend com:
  - nome: @sms-ilicinea/monitor-aps-backend
  - scripts: start, dev, test
Não modificar nada no sistema existente ainda.
```

### Task 1.2 — Serviço de Conexão ao Banco
```
Contexto: Leia agents/01-database-config-agent.md TAREFA 1 completamente.
Ação: Implementar o serviço de conexão PostgreSQL com pool de conexões.
Incluir: loadConfig, saveConfig, getPool, testConnection.
Testar: criar um script de teste isolado que conecta ao banco e lista as equipes da dim_equipe.
```

### Task 1.3 — Endpoints de Configuração
```
Contexto: Leia agents/01-database-config-agent.md TAREFA 2.
Ação: Criar todas as rotas de configuração.
Testar com curl:
  curl http://localhost:3001/api/monitor-aps/config/status
  curl -X POST http://localhost:3001/api/monitor-aps/config/test \
    -H "Content-Type: application/json" \
    -d '{"host":"localhost","port":5432,"database":"esus","user":"monitor_aps","password":"senha"}'
```

### Task 1.4 — Script SQL de Setup
```
Contexto: agents/01-database-config-agent.md TAREFA 4.
Ação: Criar o arquivo docs/setup-readonly-user.sql completo.
Verificar se as permissões estão corretas para o schema public e tabelas DW.
```

---

## FASE 2: Serviços de Indicadores

### Task 2.1 — Exploração do Schema DW
```
IMPORTANTE: Antes de escrever as queries, fazer uma consulta exploratória:

1. Conectar ao banco PostgreSQL do eSUS PEC configurado
2. Executar:
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND (table_name LIKE 'fat_%' OR table_name LIKE 'dim_%' OR table_name LIKE 'vw_%')
   ORDER BY table_name;

3. Para cada tabela DW principal, descrever suas colunas:
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'fat_atendimento_individual'
   ORDER BY ordinal_position;

4. Documentar as diferenças encontradas vs. o schema esperado em context/esus-pec-database.md
5. Ajustar as queries dos serviços de acordo com o schema real encontrado.

Referência: https://integracao.esusaps.bridge.ufsc.tech/dw/
```

### Task 2.2 — Serviço de Vínculo e Acompanhamento
```
Contexto: agents/02-indicators-service-agent.md TAREFA 1.
Ação: Implementar vinculo.service.js com todas as funções.
Testar: endpoint GET /api/monitor-aps/indicadores/vinculo?ano=2025&quadrimestre=2
Verificar: resultado retorna classificação para cada equipe ativa.
```

### Task 2.3 — Serviços de Qualidade (Bloco A: eSF/eAP)
```
Contexto: agents/02-indicators-service-agent.md TAREFA 2.
Ação: Implementar qualidade-esf.service.js com todos os indicadores 1-10.
Para cada indicador:
  1. Implementar a query SQL
  2. Testar no banco real
  3. Aplicar a função de classificação
  4. Documentar o threshold usado (e fonte: ficha técnica MS)

IMPORTANTE: Consultar as fichas técnicas oficiais em:
https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas
```

### Task 2.4 — Serviços de Qualidade (Bloco C: eSB)
```
Contexto: agents/02-indicators-service-agent.md TAREFA 3.
Ação: Implementar qualidade-esb.service.js (indicadores 13-15).
Mesmo processo da Task 2.3.
```

### Task 2.5 — Serviço de Classificação e Repasse
```
Contexto: agents/02-indicators-service-agent.md TAREFA 4.
Ação: Implementar classificacao.service.js.
Verificar os valores de repasse com a Portaria 3.493/2024 e tabela do IED do município.
Para Ilicínea/MG: verificar o estrato IED no SISAB ou com a SES-MG.
```

### Task 2.6 — Todas as Rotas da API de Indicadores
```
Contexto: agents/02-indicators-service-agent.md TAREFA 5.
Ação: Criar indicadores.routes.js com todos os endpoints documentados.
Testar cada endpoint com dados reais do banco.
```

---

## FASE 3: Frontend

### Task 3.1 — Setup do Frontend do Módulo
```
Ação: Criar a estrutura do frontend do módulo.
Instalar dependências: recharts, @headlessui/react (ou usar os já existentes no sistema).
Não duplicar dependências que já existem no sistema principal.
Configurar alias @monitor-aps para o caminho do módulo.
```

### Task 3.2 — Serviço de API Frontend
```
Contexto: agents/03-frontend-dashboard-agent.md TAREFA 6.
Ação: Criar monitorApsApi.js com todas as funções de chamada.
Adicionar tratamento de erros e loading states.
```

### Task 3.3 — Componentes Reutilizáveis
```
Contexto: agents/03-frontend-dashboard-agent.md TAREFA 5.
Ação: Criar todos os componentes base:
  - ClassificacaoBadge
  - ProgressIndicador  
  - GaugeChart (velocímetro)
  - AlertaBloqueio
  - ExportButton
Testar cada componente com dados mockados antes de conectar à API.
```

### Task 3.4 — Dashboard Principal
```
Contexto: agents/03-frontend-dashboard-agent.md TAREFA 1.
Ação: Criar Dashboard.jsx com todos os painéis descritos.
Conectar à API real de resumo.
```

### Task 3.5 — Página Vínculo Territorial
```
Contexto: agents/03-frontend-dashboard-agent.md TAREFA 2.
Ação: Criar VinculoTerritorial.jsx.
```

### Task 3.6 — Página Indicadores de Qualidade
```
Contexto: agents/03-frontend-dashboard-agent.md TAREFA 3.
Ação: Criar IndicadoresQualidade.jsx com grid de cards e modal de detalhes.
```

### Task 3.7 — Página Por Equipe
```
Contexto: agents/03-frontend-dashboard-agent.md TAREFA 4.
Ação: Criar PorEquipe.jsx com radar chart e histórico.
```

### Task 3.8 — Página de Configurações
```
Contexto: agents/01-database-config-agent.md TAREFA 3.
Ação: Criar Configuracoes.jsx completo com todas as seções.
```

---

## FASE 4: Integração

### Task 4.1 — Integração Backend ao Sistema Existente
```
Contexto: agents/04-integration-agent.md TAREFA 1.
ATENÇÃO: Modificação mínima no sistema existente.
Ação: Adicionar apenas as 3 linhas necessárias para montar as rotas do módulo.
Testar que as rotas existentes continuam funcionando.
```

### Task 4.2 — Integração do Menu de Navegação
```
Contexto: agents/04-integration-agent.md TAREFA 2.
ATENÇÃO: Modificação mínima no sistema existente.
Ação: Adicionar entrada "Monitor APS" no menu lateral.
```

### Task 4.3 — Integração das Rotas Frontend
```
Contexto: agents/04-integration-agent.md TAREFA 3.
Ação: Adicionar rotas do módulo com lazy loading.
```

### Task 4.4 — Variáveis de Ambiente e Documentação
```
Contexto: agents/04-integration-agent.md TAREFA 5.
Ação: Atualizar .env.example e criar README.md do módulo.
O README deve incluir:
  - Como instalar o módulo
  - Como configurar a conexão com o eSUS PEC
  - Como criar o usuário somente-leitura no banco
  - Descrição de cada indicador e sua fonte normativa
```

---

## FASE 5: Testes e Refinamento

### Task 5.1 — Teste de Ponta a Ponta
```
Ação: 
1. Acessar http://localhost:PORT/monitor-aps
2. Verificar que o dashboard carrega
3. Configurar a conexão com o banco do eSUS PEC local
4. Verificar que os dados de indicadores são exibidos corretamente
5. Testar filtros de equipe e período
6. Testar exportação de dados
```

### Task 5.2 — Ajuste dos Thresholds
```
IMPORTANTE: Os thresholds dos indicadores devem ser verificados nas fichas técnicas oficiais.
Acessar: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas
Para cada indicador, verificar e atualizar os valores em classificacao.service.js
```

### Task 5.3 — Documentação Final
```
Criar docs/INDICADORES.md com:
- Tabela de todos os 15 indicadores
- Fórmula de cálculo (numerador / denominador)
- Thresholds por classificação
- Fonte (número da ficha técnica do MS)
- Tabela DW usada para calcular
```
