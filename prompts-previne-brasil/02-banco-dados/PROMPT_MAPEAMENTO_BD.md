# PROMPT — Mapeamento Completo do Banco de Dados e-SUS AB

> **Arquivo:** `02-banco-dados/PROMPT_MAPEAMENTO_BD.md`
> **Usar em:** Claude Code — após o PROMPT_MASTER.md

---

## COLE ESTE PROMPT NO CLAUDE CODE:

```
## FASE 2 — MAPEAMENTO COMPLETO DO BANCO DE DADOS e-SUS AB

Você agora vai executar uma engenharia reversa completa do banco PostgreSQL do e-SUS Atenção Básica (PEC).
Execute cada etapa em ordem, documentando os resultados.

---

### ETAPA 2.1 — DESCOBERTA DOS SCHEMAS

Execute as queries abaixo e documente todos os schemas encontrados:

```sql
-- Listar todos os schemas do banco
SELECT schema_name, schema_owner
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;
```

Para cada schema encontrado, identifique sua finalidade provável com base no nome.
Schemas comuns no e-SUS AB: `sch_atendimento`, `sch_cidadao`, `sch_domicilio`,
`sch_equipe`, `sch_procedimento`, `sch_cds`, `sch_pec`, `sch_relatorio`, entre outros.

---

### ETAPA 2.2 — INVENTÁRIO COMPLETO DE TABELAS

```sql
-- Listar todas as tabelas de todos os schemas com contagem de registros
SELECT
    t.table_schema AS schema,
    t.table_name AS tabela,
    obj_description(
        (quote_ident(t.table_schema)||'.'||quote_ident(t.table_name))::regclass,
        'pg_class'
    ) AS comentario_tabela,
    pg_size_pretty(pg_total_relation_size(
        (quote_ident(t.table_schema)||'.'||quote_ident(t.table_name))::regclass
    )) AS tamanho
FROM information_schema.tables t
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_schema, t.table_name;
```

---

### ETAPA 2.3 — MAPEAMENTO DE RELACIONAMENTOS

```sql
-- Todas as chaves estrangeiras do banco
SELECT
    tc.table_schema AS schema_origem,
    tc.table_name AS tabela_origem,
    kcu.column_name AS coluna_origem,
    ccu.table_schema AS schema_destino,
    ccu.table_name AS tabela_destino,
    ccu.column_name AS coluna_destino,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_schema, tc.table_name;
```

---

### ETAPA 2.4 — TABELAS CRÍTICAS DOS INDICADORES

Para cada tabela abaixo (se existir no banco), documente TODAS as colunas:

```sql
-- Template: execute para cada tabela relevante
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    col_description(
        (quote_ident(table_schema)||'.'||quote_ident(table_name))::regclass,
        ordinal_position
    ) AS comentario
FROM information_schema.columns
WHERE table_schema = '[SCHEMA]' AND table_name = '[TABELA]'
ORDER BY ordinal_position;
```

**Tabelas prioritárias a mapear:**

#### BLOCO CIDADÃO
- `tb_cidadao` / `tb_pessoa` — cadastro do cidadão
- `tb_cns` — Cartão Nacional de Saúde
- `tb_cpf` — CPF do cidadão
- Tabelas de condições: diabetes, hipertensão, gestação, etc.

#### BLOCO ATENDIMENTO
- `tb_atendimento_individual` — atendimento individual (ficha de atendimento individual)
- `tb_atendimento_odontologico` — atendimento odontológico
- `tb_procedimento_realizado` / `tb_procedimento_sistema_saude` — procedimentos SIGTAP
- `tb_problema_condicao_avaliado` — CIDs e CIAP avaliados no atendimento

#### BLOCO CDS (Coleta de Dados Simplificada)
- `tb_ficha_atendimento_individual` — ficha CDS individual
- `tb_ficha_atendimento_coletivo` — ficha CDS coletivo
- `tb_ficha_visita_domiciliar` — ficha de visita do ACS
- `tb_ficha_cadastro_individual` — ficha de cadastro individual
- `tb_ficha_cadastro_domiciliar` — ficha de cadastro domiciliar/territorial
- `tb_ficha_procedimentos` — ficha de procedimentos

#### BLOCO GESTANTE
- Tabelas de pré-natal, DUM, IG, vacinas, exames de gestante

#### BLOCO CRIANÇA
- Tabelas de puericultura, desenvolvimento, vacinação infantil

#### BLOCO DOENÇAS CRÔNICAS
- Tabelas de hipertensão, diabetes, saúde mental, tabagismo

#### BLOCO VACINAÇÃO
- `tb_imunobiologico_administrado` — vacinas aplicadas
- Tabelas de calendário vacinal

#### BLOCO EXAMES
- `tb_exame_solicitado` — exames solicitados
- `tb_exame_resultado` — resultados de exames
- Específicos: PA, HbA1c, colposcopia, mamografia, etc.

#### BLOCO EQUIPE/PROFISSIONAL
- `tb_equipe` — equipes cadastradas
- `tb_profissional` — profissionais
- `tb_lotacao` — lotação dos profissionais
- `tb_cbo` — tabela de CBOs

---

### ETAPA 2.5 — MAPA DE INDICADORES × TABELAS

Após mapear as tabelas, crie uma matriz documentando:

| Indicador Previne Brasil | Numerador (Tabela + Filtro) | Denominador (Tabela + Filtro) | Ficha e-SUS |
|---|---|---|---|
| I1 — Proporção de gestantes com pré-natal no 1º trimestre | ... | ... | FAI / PEC |
| I2 — Proporção de gestantes com consultas em dia | ... | ... | FAI / PEC |
| I3 — Proporção de gestantes com exame de sífilis e HIV | ... | ... | FAI / PEC |
| I4 — Cobertura de citopatológico | ... | ... | FAI / PEC |
| I5 — Cobertura de PA em hipertensos | ... | ... | FAI / PEC |
| I6 — Cobertura de HbA1c em diabéticos | ... | ... | FAI / PEC |
| I7 — Cobertura vacinal poliomielite e penta | ... | ... | FV / PEC |

---

### ETAPA 2.6 — QUERIES PADRÃO (SALVAR COMO BIBLIOTECA)

Após o mapeamento, gere e salve as seguintes queries como biblioteca reutilizável:

**Q001 — Lista de gestantes ativas da equipe**
**Q002 — Gestantes sem consulta no trimestre atual**
**Q003 — Gestantes sem exame de sífilis/HIV**
**Q004 — Mulheres 25-64 anos sem citopatológico nos últimos 3 anos**
**Q005 — Hipertensos cadastrados sem PA registrada no semestre**
**Q006 — Diabéticos sem HbA1c no semestre**
**Q007 — Crianças 1 ano sem vacina poliomielite ou penta**
**Q008 — Painel geral: todos os indicadores com % de meta para a equipe**

Para cada query, o formato deve ser:

```sql
-- Q00X — [NOME DA QUERY]
-- Indicador: [Número e nome do indicador]
-- Retorna: [O que a query devolve]
-- Período: [Como passar o período como parâmetro]
-- Observação: [Regras especiais]

SELECT
    c.nome_cidadao,
    c.cns,
    c.cpf,
    c.data_nascimento,
    -- demais colunas relevantes
FROM [schema].[tabela] AS t
JOIN [schema].[tb_cidadao] AS c ON c.id = t.id_cidadao
WHERE
    -- filtros do indicador
    AND t.data_registro BETWEEN :data_inicio AND :data_fim
ORDER BY c.nome_cidadao;
```

---

### ETAPA 2.7 — DOCUMENTAÇÃO FINAL DO BANCO

Gere um arquivo `MAPA_BANCO_DADOS.md` com:
1. Diagrama textual de relacionamentos (notação ASCII)
2. Glossário de tabelas (nome → função no sistema)
3. Glossário de colunas críticas para indicadores
4. Índice de queries por indicador
5. Instruções de acesso ao banco (porta padrão, schema principal, usuário de leitura)

---

Ao concluir esta fase, confirme com:
"✅ FASE 2 CONCLUÍDA — Banco mapeado. X tabelas documentadas, Y queries geradas."
E pergunte se deve prosseguir para a FASE 3 (documentação dos indicadores).
```

---

> **Próximo passo:** Use `03-financiamento/PROMPT_DOCUMENTACAO_PREV.md`
