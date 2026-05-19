# context/esus-pec-database.md — Banco de Dados do e-SUS APS PEC

## Visão Geral

O e-SUS APS PEC armazena dados em PostgreSQL, organizado em dois esquemas principais:
1. **Tabelas operacionais** (prefixo `tb_`) — dados brutos do sistema
2. **Data Warehouse** (prefixo `fat_`, `dim_`, `vw_`) — dados processados para relatórios

**Sempre preferir as tabelas DW** (`fat_`, `dim_`, `vw_`) para este módulo.
Documentação oficial: https://integracao.esusaps.bridge.ufsc.tech/dw/

---

## Schema Real (banco dev Docker — inspecionado em 2026-05-19)

### Inventário completo

| Tipo | Tabela/View |
|------|-------------|
| BASE TABLE | dim_cbo |
| BASE TABLE | dim_ciap2 |
| BASE TABLE | dim_cid10 |
| BASE TABLE | dim_equipe |
| BASE TABLE | dim_tempo |
| BASE TABLE | dim_unidade_saude |
| BASE TABLE | fat_atendimento_individual |
| BASE TABLE | fat_atendimento_odontologico |
| BASE TABLE | fat_ativ_coletiva |
| BASE TABLE | fat_cad_domiciliar |
| BASE TABLE | fat_cad_individual |
| BASE TABLE | fat_procedimento_individual |
| BASE TABLE | fat_visita_domiciliar |
| VIEW | vw_acompanhamento_diabetes |
| VIEW | vw_acompanhamento_hipertensao |
| VIEW | vw_acompanhamento_pre_natal |
| VIEW | vw_cobertura_cadastral |

---

## Dimensões (schema real)

### dim_equipe
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| co_seq_dim_equipe | bigint | NO | nextval (PK) |
| nu_ine | varchar(10) | NO | — |
| no_equipe | varchar(100) | YES | — |
| tp_equipe | integer | YES | — |
| nu_cnes | varchar(7) | YES | — |
| st_ativo | boolean | YES | true |

`tp_equipe`: 70=eSF, 71=eAP, 72=eSB, 80=eMulti

### dim_unidade_saude
| Coluna | Tipo | Nullable |
|--------|------|----------|
| co_seq_dim_uns | bigint | NO |
| nu_cnes | varchar(7) | NO |
| no_unidade_saude | varchar(100) | YES |
| co_municipio_ibge | varchar(7) | YES |

### dim_tempo
| Coluna | Tipo | Nullable |
|--------|------|----------|
| co_seq_dim_tempo | bigint | NO |
| dt_registro | date | NO |
| nu_dia | integer | YES |
| nu_mes | integer | YES |
| nu_ano | integer | YES |
| nu_quadrimestre | integer | YES |
| nu_competencia | integer | YES |

`nu_quadrimestre`: 1=jan-abr, 2=mai-ago, 3=set-dez
`nu_competencia`: AAAAMM (ex: 202506)

### dim_cbo
| Coluna | Tipo | Nullable |
|--------|------|----------|
| co_seq_dim_cbo | bigint | NO |
| nu_cbo | varchar(6) | NO |
| no_cbo | varchar(100) | YES |

CBOs relevantes:
- `225142` — Médico de Família e Comunidade
- `225125` — Médico Clínico Geral
- `223505` — Enfermeiro
- `322220` — Técnico de Enfermagem
- `516220` — Agente Comunitário de Saúde (ACS)
- `223208` — Cirurgião-Dentista
- `322230` — Auxiliar de Saúde Bucal

### dim_cid10
| Coluna | Tipo | Nullable |
|--------|------|----------|
| co_seq_dim_cid10 | bigint | NO |
| nu_cid10 | varchar(5) | NO |
| no_cid10 | varchar(200) | YES |

### dim_ciap2
| Coluna | Tipo | Nullable |
|--------|------|----------|
| co_seq_dim_ciap2 | bigint | NO |
| nu_ciap2 | varchar(5) | NO |
| no_ciap2 | varchar(200) | YES |

CIAP-2 relevantes: K86/K87=HAS, T90=DM, W78/W79/W84=Gestação, P76=Saúde Mental

---

## Fatos (schema real)

### fat_cad_individual
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| co_seq_fat_cad_ind | bigint | NO | nextval |
| co_dim_equipe | bigint | YES | — |
| co_dim_tempo | bigint | YES | — |
| co_cidadao | bigint | NO | — |
| dt_nascimento | date | YES | — |
| st_feminino | boolean | YES | — |
| nu_cpf | varchar(11) | YES | — |
| nu_cns | varchar(15) | YES | — |
| st_bolsa_familia | boolean | YES | false |
| st_bpc | boolean | YES | false |
| st_ativo | boolean | YES | true |

### fat_cad_domiciliar
| Coluna | Tipo | Nullable |
|--------|------|----------|
| co_seq_fat_cad_dom | bigint | NO |
| co_dim_equipe | bigint | YES |
| co_dim_tempo | bigint | YES |
| co_cidadao_responsavel | bigint | YES |
| tp_situacao_moradia | integer | YES |

### fat_atendimento_individual
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| co_seq_fat_atd_ind | bigint | NO | nextval |
| co_dim_equipe | bigint | YES | — |
| co_dim_unidade_saude | bigint | YES | — |
| co_dim_cbo | bigint | YES | — |
| co_dim_tempo | bigint | YES | — |
| co_cidadao | bigint | NO | — |
| co_dim_tipo_atendimento | integer | YES | — |
| co_dim_cid10_avaliado | bigint | YES | — |
| co_dim_ciap2_avaliado | bigint | YES | — |
| nu_peso | numeric(5,2) | YES | — |
| nu_altura | numeric(5,2) | YES | — |
| st_encaminhamento | boolean | YES | false |

`co_dim_tipo_atendimento`: 1=programado, 2=espontâneo, 3=escuta inicial, 4=consulta do dia, 5=urgência

### fat_atendimento_odontologico
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| co_seq_fat_atd_odnt | bigint | NO | nextval |
| co_dim_equipe | bigint | YES | — |
| co_dim_tempo | bigint | YES | — |
| co_cidadao | bigint | NO | — |
| st_conclusao_tratamento | boolean | YES | false |
| st_primeira_consulta | boolean | YES | false |
| nu_extracao_dente | integer | YES | 0 |

### fat_visita_domiciliar
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| co_seq_fat_vst_dom | bigint | NO | nextval |
| co_dim_equipe | bigint | YES | — |
| co_dim_tempo | bigint | YES | — |
| co_dim_cbo | bigint | YES | — |
| co_cidadao | bigint | NO | — |
| st_visita_realizada | boolean | YES | true |
| co_dim_motivo_visita | integer | YES | — |

### fat_ativ_coletiva
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| co_seq_fat_atv_col | bigint | NO | nextval |
| co_dim_equipe | bigint | YES | — |
| co_dim_tempo | bigint | YES | — |
| co_dim_tipo_atividade | integer | YES | — |
| nu_participantes | integer | YES | 0 |
| st_pse | boolean | YES | false |

### fat_procedimento_individual
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| co_seq_fat_proc_ind | bigint | NO | nextval |
| co_dim_equipe | bigint | YES | — |
| co_dim_tempo | bigint | YES | — |
| co_cidadao | bigint | NO | — |
| nu_sigtap | varchar(10) | YES | — |
| nu_quantidade | integer | YES | 1 |

Usada para registros de vacinas (código SIGTAP) e procedimentos avulsos.

---

## Views (schema real)

### vw_cobertura_cadastral
```sql
-- Colunas disponíveis:
nu_ine, no_equipe, nu_cnes,
nu_cadastros_individuais,      -- COUNT DISTINCT co_cidadao de fat_cad_individual
nu_cadastros_domiciliares,     -- COUNT DISTINCT co_cidadao_responsavel de fat_cad_domiciliar
nu_criancas_0_5,               -- nascidos nos últimos 5 anos
nu_idosos_60_mais,             -- nascidos há mais de 60 anos
nu_bolsa_familia,              -- st_bolsa_familia = true
nu_bpc                         -- st_bpc = true
```

### vw_acompanhamento_pre_natal
```sql
-- Colunas disponíveis:
nu_ine, no_equipe, co_cidadao,
nu_consultas_pn,               -- COUNT DISTINCT atendimentos com CIAP2 W78/W79/W84
dt_ultimo_atendimento,
st_pn_adequado                 -- true se nu_consultas_pn >= 6
```

### vw_acompanhamento_hipertensao
```sql
-- Colunas disponíveis:
nu_ine, no_equipe, co_cidadao,
nu_consultas_ultimo_ano,       -- COUNT DISTINCT atendimentos com CIAP2 K86/K87 ou CID I1%
dt_ultimo_atendimento,
st_acompanhado                 -- true se nu_consultas_ultimo_ano >= 2
```

### vw_acompanhamento_diabetes
```sql
-- Colunas disponíveis:
nu_ine, no_equipe, co_cidadao,
nu_consultas_ultimo_ano,       -- COUNT DISTINCT atendimentos com CIAP2 T90 ou CID E1%
dt_ultimo_atendimento,
st_acompanhado                 -- true se nu_consultas_ultimo_ano >= 2
```

---

<!-- Índices documentados na seção "Índices Existentes" abaixo das views -->

---

## Índices Existentes (após correções — 03-schema-corrections.sql)

| Índice | Tabela | Coluna(s) | Tipo |
|--------|--------|-----------|------|
| idx_fat_atd_equipe | fat_atendimento_individual | co_dim_equipe | btree |
| **idx_fat_atd_equipe_tempo** | fat_atendimento_individual | **(co_dim_equipe, co_dim_tempo)** | btree composto |
| idx_fat_atd_tempo | fat_atendimento_individual | co_dim_tempo | btree |
| idx_fat_atd_cidadao | fat_atendimento_individual | co_cidadao | btree |
| **idx_fat_vis_cbo** | fat_visita_domiciliar | co_dim_cbo | btree |
| idx_fat_vis_equipe | fat_visita_domiciliar | co_dim_equipe | btree |
| idx_fat_cad_equipe | fat_cad_individual | co_dim_equipe | btree |
| **idx_fat_cad_nascimento** | fat_cad_individual | dt_nascimento | btree |
| **idx_fat_proc_sigtap** | fat_procedimento_individual | nu_sigtap | btree |
| **idx_fat_vac_equipe** | fat_vacinacao | co_dim_equipe | btree |
| **idx_fat_vac_sigtap** | fat_vacinacao | nu_sigtap_imuno | btree |
| **idx_fat_vac_cidadao** | fat_vacinacao | co_cidadao | btree |
| (PKs e UNIQUEs em todas as dimensões) | — | — | — |

*Negrito = adicionados em 03-schema-corrections.sql*

---

## fat_vacinacao (adicionada em 03-schema-corrections.sql)

Tabela ausente no DW simplificado original. Crítica para os Indicadores 2 (vacinação infantil) e 9 (cobertura vacinal).

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| co_seq_fat_vac | bigint | NO | nextval |
| co_dim_equipe | bigint | YES | — |
| co_dim_tempo | bigint | YES | — |
| co_cidadao | bigint | NO | — |
| nu_cbo | varchar(6) | YES | — |
| nu_sigtap_imuno | varchar(10) | YES | — |
| nu_dose | integer | YES | 1 |
| st_realizado | boolean | YES | true |

**Seed dev:** 120 doses — ESF VILA NOVA com vacinação completa (6 vacinas), ESF CENTRO com vacinação parcial (2 vacinas). Reflete cenário real de cobertura diferenciada entre equipes.

Códigos SIGTAP principais:

| Vacina | SIGTAP |
|--------|--------|
| DTP | 0301060029 |
| Hepatite B | 0301060100 |
| Hib | 0301060037 |
| Pólio | 0301060118 |
| Tríplice viral (SCR) | 0301060196 |
| Pneumocócica 10v | 0301060160 |

---

## Views (estado final após 03-schema-corrections.sql)

As views foram enriquecidas com as colunas do PEC real. Colunas ausentes no dev retornam `NULL` explícito (documentado), garantindo compatibilidade de interface com o PEC real sem quebrar as queries.

### vw_cobertura_cadastral — colunas adicionadas
- `pct_completude` — score da Portaria: 1,5 pts (cad. individual + domiciliar) / 0,75 pts (só individual) → % do máximo possível
- `nu_cadastros_atualizados_12m` — cadastros com `dt_registro` nos últimos 12 meses

### vw_acompanhamento_hipertensao — colunas adicionadas
- `st_controlado` — no dev: proxy de `st_acompanhado`. No PEC real: PA sistólica < 140 e diastólica < 90
- `nu_ultima_pa_sistolica` — `NULL` no dev (campo físico ausente)
- `nu_ultima_pa_diastolica` — `NULL` no dev (campo físico ausente)

### vw_acompanhamento_diabetes — colunas adicionadas
- `st_controlado` — no dev: proxy de `st_acompanhado`. No PEC real: HbA1c < 7%
- `nu_ultima_glicemia` — `NULL` no dev
- `st_hba1c_realizado` — `NULL` no dev

### vw_acompanhamento_pre_natal — colunas adicionadas
- `dt_inicio_pn` — data da primeira consulta de pré-natal
- `st_consulta_puerperal` — `false` no dev (sem registro de parto)
- `st_vacinacao_hepatite_b`, `st_vacinacao_influenza` — `NULL` no dev
- `st_exame_sifilis`, `st_exame_hiv`, `st_exame_glucose` — `NULL` no dev

---

## ⚠️ Diferenças Residuais: Dev vs DW PEC real

### Colunas ausentes no dev (mas presentes no PEC real)

| Tabela | Coluna ausente | Impacto |
|--------|---------------|---------|
| `fat_atendimento_individual` | `st_presente_lista_aten` | Baixo — não usado nos 15 indicadores |
| `fat_cad_individual` | `nu_micro_area` | Médio — útil para agrupamento territorial |
| `fat_cad_individual` | `st_responsavel_familiar` | Baixo |
| `fat_cad_individual` | `tp_sexo` (int) | **Dev usa `st_feminino` (boolean)** — adaptar queries |
| `fat_visita_domiciliar` | `tp_perfil_profissional` | Médio — no dev, filtrar por `co_dim_cbo` |
| `fat_visita_domiciliar` | `co_dim_desfecho_visita` | Baixo |

### Views com colunas ausentes no dev vs PEC real

| View | Colunas ausentes no dev | Impacto no cálculo |
|------|-----------------------|--------------------|
| `vw_acompanhamento_pre_natal` | `dt_inicio_pn`, `st_consulta_puerperal`, `st_vacinacao_hepatite_b`, `st_vacinacao_influenza`, `st_exame_sifilis`, `st_exame_hiv`, `st_exame_glucose` | **Alto** — Indicador 3 depende dessas colunas. No dev, calcular via `fat_procedimento_individual` |
| `vw_acompanhamento_hipertensao` | `nu_ultima_pa_sistolica`, `nu_ultima_pa_diastolica`, `st_controlado` | **Alto** — Indicador 4. No dev, `st_acompanhado` substitui `st_controlado` (critério diferente) |
| `vw_acompanhamento_diabetes` | `nu_ultima_glicemia`, `st_hba1c_realizado`, `st_controlado` | **Alto** — Indicador 5. Mesma situação: `st_acompanhado` ≠ `st_controlado` |
| `vw_cobertura_cadastral` | `nu_cadastros_atualizados_12m`, `pct_completude` | **Médio** — Componente II. Calcular completude manualmente |

### Tabelas inteiramente ausentes no dev (presentes no PEC real)

| Tabela | Finalidade | Indicadores afetados |
|--------|-----------|---------------------|
| `fat_vacinacao` | Registros de vacinação do calendário | **2** (vacinação infantil), **9** (cobertura vacinal) |
| `fat_atendimento_domiciliar` | Atendimentos no domicílio | **6** (pessoa idosa) |
| `dim_municipio` | Dimensão município com IBGE, população, estrato | Componente I (IED), VI (per capita) |

**Workaround para dev:** vacinas estão sendo registradas em `fat_procedimento_individual` via `nu_sigtap`. Usar essa tabela para indicadores 2 e 9 enquanto o PEC real não for conectado.

### Tabela presente no dev mas ausente na documentação do contexto

| Tabela | Observação |
|--------|-----------|
| `fat_procedimento_individual` | Presente no dev. No PEC real existe com o mesmo nome. Útil para vacinas (SIGTAP) e procedimentos avulsos. |

### Índices ausentes (impacto em performance)

| Índice recomendado | Tabela | Motivo |
|-------------------|--------|--------|
| `(co_dim_equipe, co_dim_tempo)` composto | `fat_atendimento_individual` | Padrão de query mais comum — todas as queries filtram por equipe + período |
| `(co_dim_cbo)` | `fat_visita_domiciliar` | Filtro por ACS nas queries do Indicador 8 |
| `(dt_nascimento)` | `fat_cad_individual` | Agrupamentos etários (crianças, idosos) |
| `(nu_sigtap)` | `fat_procedimento_individual` | Busca por código de vacina |

---

## Queries Padrão

### Filtro por quadrimestre (base de todas as queries)
```sql
JOIN dim_tempo dt ON fai.co_dim_tempo = dt.co_seq_dim_tempo
WHERE dt.nu_ano = $1
  AND dt.nu_quadrimestre = $2
  AND de.st_ativo = true
```

### Indicador 1 — Tipos de atendimento por demanda
```sql
SELECT
  de.nu_ine, de.no_equipe,
  COUNT(CASE WHEN fai.co_dim_tipo_atendimento = 1 THEN 1 END) AS programados,
  COUNT(CASE WHEN fai.co_dim_tipo_atendimento = 2 THEN 1 END) AS espontaneos,
  COUNT(CASE WHEN fai.co_dim_tipo_atendimento = 3 THEN 1 END) AS escuta_inicial,
  COUNT(CASE WHEN fai.co_dim_tipo_atendimento = 4 THEN 1 END) AS consulta_dia,
  COUNT(CASE WHEN fai.co_dim_tipo_atendimento = 5 THEN 1 END) AS urgencia,
  COUNT(*) AS total
FROM fat_atendimento_individual fai
JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_tempo dt   ON fai.co_dim_tempo  = dt.co_seq_dim_tempo
WHERE dt.nu_ano = $1 AND dt.nu_quadrimestre = $2 AND de.st_ativo = true
GROUP BY de.nu_ine, de.no_equipe;
```

### Indicador 8 — Visitas domiciliares por ACS
```sql
SELECT
  de.nu_ine, de.no_equipe,
  COUNT(DISTINCT fvd.co_cidadao) AS pessoas_visitadas,
  COUNT(*) AS total_visitas
FROM fat_visita_domiciliar fvd
JOIN dim_equipe de ON fvd.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_tempo dt   ON fvd.co_dim_tempo  = dt.co_seq_dim_tempo
JOIN dim_cbo dc     ON fvd.co_dim_cbo    = dc.co_seq_dim_cbo
WHERE dt.nu_ano = $1 AND dt.nu_quadrimestre = $2
  AND dc.nu_cbo = '516220'   -- ACS
  AND fvd.st_visita_realizada = true
  AND de.st_ativo = true
GROUP BY de.nu_ine, de.no_equipe;
```

### Vacinas (workaround dev — via fat_procedimento_individual)
```sql
-- No PEC real usar fat_vacinacao. Em dev, SIGTAP registrado em fat_procedimento_individual
SELECT
  de.nu_ine, de.no_equipe,
  fpi.nu_sigtap,
  COUNT(*) AS doses_aplicadas
FROM fat_procedimento_individual fpi
JOIN dim_equipe de ON fpi.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_tempo dt   ON fpi.co_dim_tempo  = dt.co_seq_dim_tempo
WHERE dt.nu_ano = $1 AND dt.nu_quadrimestre = $2
  AND fpi.nu_sigtap IN ('0301060029','0301060100','0301060118') -- exemplos: DTP, Polio, etc.
GROUP BY de.nu_ine, de.no_equipe, fpi.nu_sigtap;
```

---

## Notas de Implementação

1. **`st_feminino` vs `tp_sexo`**: O dev usa boolean `st_feminino`. O PEC real usa `tp_sexo` (integer). Adaptar se necessário ao conectar em produção.
2. **Views simplificadas**: As views `vw_acompanhamento_*` do dev têm menos colunas que o PEC real. Sempre verificar as colunas disponíveis antes de usar em produção.
3. **Vacinas**: Em dev usar `fat_procedimento_individual.nu_sigtap`. Em produção verificar se `fat_vacinacao` existe antes de migrar as queries.
4. **Performance**: Sempre filtrar por `co_dim_tempo` primeiro — é o índice mais seletivo. Adicionar índice composto `(co_dim_equipe, co_dim_tempo)` em produção se houver lentidão.
5. **Schema**: Todas as tabelas DW estão no schema `public`. Verificar se há schema `dw` separado no PEC real instalado na SMS.
6. **Versão**: Banco dev é PostgreSQL 15.18 (Alpine). O PEC real pode estar em versão diferente — evitar sintaxe exclusiva do PG 15.
