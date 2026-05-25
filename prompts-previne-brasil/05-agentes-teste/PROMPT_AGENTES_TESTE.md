# PROMPT — Agentes de Teste, Correção e Manutenção (Claude Code)

> **Arquivo:** `05-agentes-teste/PROMPT_AGENTES_TESTE.md`
> **Usar em:** Claude Code — fase de validação e manutenção contínua

---

## COLE ESTE PROMPT NO CLAUDE CODE:

```
## FASE 5 — AGENTES DE TESTE, CORREÇÃO E MANUTENÇÃO DO SISTEMA

Você vai atuar como um conjunto de agentes especializados de QA (Quality Assurance)
para avaliar, corrigir e evoluir o sistema de dashboard de indicadores da AB.

---

### AGENTE 1 — VALIDADOR DE QUERIES SQL

**Responsabilidade:** Validar a correção de todas as queries de indicadores.

Para CADA query de indicador (Q001 a Q008 e demais), execute:

**Protocolo de validação:**

```sql
-- TESTE 1: A query executa sem erros?
-- Execute e capture qualquer exception

-- TESTE 2: O resultado faz sentido clinicamente?
-- Ex: numerador nunca pode ser > denominador
-- Ex: não pode haver gestantes com idade < 10 ou > 60 anos

-- TESTE 3: Período está correto?
-- Verificar se os filtros de data cobrem o período esperado
-- Testar com EXPLAIN ANALYZE para verificar performance

-- TESTE 4: Duplicatas?
-- SELECT COUNT(*) vs SELECT COUNT(DISTINCT co_cidadao) devem ser iguais
-- (um cidadão não pode entrar duas vezes no mesmo indicador)

-- TESTE 5: Casos extremos
-- E se o denominador for 0? (divisão por zero)
-- E se não houver registros no período? (NULL vs 0)
-- E se a equipe tiver INE não encontrado? (JOIN sem resultado)
```

**Correções automáticas esperadas:**
- Adicionar `NULLIF(denominador, 0)` em todas as divisões
- Adicionar `COALESCE(resultado, 0)` onde necessário
- Adicionar índices nas colunas mais filtradas
- Parametrizar datas (usar `$1`, `$2` ao invés de hardcode)

---

### AGENTE 2 — AUDITOR DE DADOS

**Responsabilidade:** Comparar os resultados do dashboard com os dados oficiais
do SISAB (Sistema de Informação em Saúde para Atenção Básica).

**Protocolo:**

1. **Buscar dados do SISAB:**
   - Acessar relatórios públicos do SISAB para CNES 2794454 / Ilicínea-MG
   - Registrar os valores oficiais dos indicadores no período atual

2. **Comparar com o banco local:**
   ```
   Para cada indicador:
   - Numerador SISAB: X
   - Numerador banco local: Y
   - Diferença: Z (%)
   - Status: ✅ OK (diff < 2%) | ⚠️ ATENÇÃO (diff 2-10%) | ❌ DIVERGENTE (diff > 10%)
   ```

3. **Investigar divergências > 5%:**
   - A query está usando o período correto?
   - Há registros no banco que não foram enviados ao SISAB?
   - Há registros no SISAB que não constam no banco local?

---

### AGENTE 3 — TESTADOR DE INTERFACE (E2E)

**Responsabilidade:** Testar todas as telas e funcionalidades do frontend.

**Checklist de testes:**

```
PAINEL PRINCIPAL
[ ] Todos os 8+ indicadores aparecem com dados
[ ] Percentual está formatado corretamente (ex: "67,3%")
[ ] Badge de status (CRÍTICO/ATENÇÃO/META ATINGIDA) está correto
[ ] Clicar no card navega para a página de detalhe correta
[ ] Gráfico de radar renderiza sem erros
[ ] Alertas críticos aparecem em ordem de urgência
[ ] Atualização automática funciona (polling ou websocket)

DETALHE DO INDICADOR
[ ] Nome e descrição corretos para o indicador
[ ] Gráfico de evolução mostra últimos 12 meses
[ ] Linha da meta aparece corretamente
[ ] Filtro por microárea funciona
[ ] Totais numéricos batem com o painel principal

LISTA NOMINAL
[ ] Nome do cidadão aparece sem truncamento
[ ] CNS formatado: 000 0000 0000 0000
[ ] Coluna "Pendência" mostra texto específico e útil
[ ] Filtro por nome (busca em tempo real, debounce 300ms)
[ ] Filtro por microárea
[ ] Exportar CSV gera arquivo com encoding UTF-8 (para acentos)
[ ] CSV contém colunas: Nome, CNS, CPF, Data Nasc., Microárea, ACS, Pendência
[ ] Botão imprimir abre janela de impressão formatada

FILTROS GLOBAIS
[ ] Filtro por equipe (INE) funciona
[ ] Filtro por período (competência) funciona
[ ] Estado dos filtros persiste ao navegar entre páginas

AUTENTICAÇÃO
[ ] Login com credenciais corretas → acessa o sistema
[ ] Login com credenciais erradas → mensagem de erro clara
[ ] Token expirado → redireciona para login
[ ] Logout limpa sessão completamente
```

---

### AGENTE 4 — OTIMIZADOR DE PERFORMANCE

**Responsabilidade:** Garantir que o sistema responde rapidamente mesmo com
muitos dados (município com 10.000+ cidadãos cadastrados).

**Protocolo de otimização:**

```sql
-- 1. Verificar queries lentas (> 2 segundos)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
[query do indicador aqui];

-- 2. Verificar índices existentes nas tabelas dos indicadores
SELECT
    schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname IN ('sch_atendimento', 'sch_cidadao', 'sch_cds')
ORDER BY schemaname, tablename;

-- 3. Verificar se os índices estão sendo usados (seq scan vs index scan)
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables
WHERE schemaname IN ('sch_atendimento', 'sch_cidadao')
ORDER BY seq_scan DESC;
```

**Otimizações a implementar:**
- [ ] Cache no backend (Redis ou cache em memória) para queries do painel principal
- [ ] Cache TTL: 15 minutos para dados agregados, 5 minutos para lista nominal
- [ ] Paginação na lista nominal (máximo 100 registros por página)
- [ ] Índices compostos para as queries mais pesadas:
  ```sql
  -- Exemplos de índices a criar no schema sch_dashboard (não tocar no e-SUS)
  -- Usar MATERIALIZED VIEWS para pré-computar resultados
  CREATE MATERIALIZED VIEW sch_dashboard.mv_indicador_i6_hipertensos AS
  [query do indicador I6]
  WITH DATA;
  -- Atualizar via cron: REFRESH MATERIALIZED VIEW CONCURRENTLY sch_dashboard.mv_indicador_i6_hipertensos;
  ```

---

### AGENTE 5 — IMPLEMENTADOR DE NOVAS FUNCIONALIDADES

**Responsabilidade:** Implementar funcionalidades adicionais após o sistema base estar funcionando.

**Fila de funcionalidades (prioridade decrescente):**

**PRIORIDADE ALTA:**
1. **Notificações Push / Email:**
   - Alertar o coordenador da UBS quando um indicador cair abaixo da meta
   - Enviar relatório semanal por email com resumo dos indicadores

2. **Modo Offline / PWA:**
   - O ACS pode baixar a lista nominal no celular antes da visita
   - Funciona sem internet na área rural

3. **Histórico de Ações:**
   - Registrar (em `sch_dashboard`) quando um cidadão foi atendido via busca ativa
   - Linha do tempo: "João Silva — PA aferida em 15/03 pelo ACS Maria"

**PRIORIDADE MÉDIA:**
4. **Relatório em PDF:**
   - Relatório mensal do quadrimestre para enviar à Secretaria de Saúde
   - Gerado automaticamente no último dia do mês

5. **Comparativo entre Equipes:**
   - Se houver mais de uma equipe eSF no município, comparar indicadores

6. **Projeção de Meta:**
   - "Se a equipe mantiver o ritmo atual, atingirá X% no final do quadrimestre"
   - Gráfico de projeção linear

**PRIORIDADE BAIXA:**
7. **Integração com RNDS (Rede Nacional de Dados em Saúde)**
8. **Importação de dados do SISAB para validação cruzada**
9. **App mobile nativo (React Native)**

---

### AGENTE 6 — DOCUMENTADOR DE MANUTENÇÃO

**Responsabilidade:** Criar documentação para que qualquer técnico da SMS
possa manter o sistema funcionando.

**Documentos a gerar:**

**MANUAL_INSTALACAO.md**
- Requisitos de hardware e software
- Passo a passo de instalação do zero
- Configuração do banco de dados (usuário readonly)
- Configuração do servidor (PM2 + Nginx)
- Certificado SSL (Let's Encrypt)

**MANUAL_OPERACAO.md**
- Como iniciar/parar/reiniciar o sistema
- Como verificar os logs de erro
- Como atualizar quando o e-SUS for atualizado
- O que fazer quando o banco mudar de estrutura
- Backup das configurações

**MANUAL_USUARIO.md**
- Guia visual (com prints) para os usuários finais (enfermeiro, coordenador, ACS)
- Como interpretar cada gráfico
- Como usar os filtros
- Como exportar a lista nominal para busca ativa
- FAQ dos usuários

**TROUBLESHOOTING.md**
- Problema: "Os dados não atualizam" → Causa e solução
- Problema: "A lista nominal está vazia" → Causa e solução
- Problema: "O % do dashboard difere do SISAB" → Causa e solução
- Problema: "Sistema lento" → Causa e solução

---

### PROTOCOLO DE EXECUÇÃO DOS AGENTES

Quando este prompt for ativado, execute os agentes na seguinte ordem:

```
1. AGENTE 1 (Validador SQL) → Corrija erros antes de tudo
2. AGENTE 3 (Testador Interface) → Verifique o que está funcionando
3. AGENTE 4 (Otimizador) → Melhore a performance
4. AGENTE 2 (Auditor de Dados) → Valide contra o SISAB
5. AGENTE 5 (Novas Funcionalidades) → Implemente melhorias
6. AGENTE 6 (Documentador) → Gere a documentação final
```

Após cada agente, gere um relatório:
```
=== RELATÓRIO DO AGENTE X ===
✅ Passou: N itens
⚠️ Avisos: N itens
❌ Falhou: N itens
🔧 Correções aplicadas: [lista]
📋 Pendências: [lista]
```

---

### COMANDO DE DIAGNÓSTICO RÁPIDO

Para verificar o estado geral do sistema a qualquer momento:

```bash
# Execute este script para diagnóstico rápido
curl -s http://localhost:3001/api/health | jq .

# Saída esperada:
{
  "status": "ok",
  "database": "conectado",
  "versao": "1.0.0",
  "indicadores": {
    "total": 8,
    "calculados_com_sucesso": 8,
    "erros": 0
  },
  "ultima_atualizacao": "2024-03-15T10:30:00Z",
  "tempo_resposta_ms": 245
}
```

---

Ao concluir todos os agentes, gere o relatório final:
"✅ SISTEMA COMPLETO — Painel de Indicadores da AB — SMS Ilicínea
   X indicadores monitorados | Y cidadãos na lista nominal | Z alertas ativos"
```

---

> **Sistema completo.** Retorne ao `README.md` para visão geral.
