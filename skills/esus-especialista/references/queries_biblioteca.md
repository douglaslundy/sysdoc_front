# Biblioteca de Queries — e-SUS AB

> Todas as queries são somente SELECT. Parâmetros: `:nu_ine`, `:dt_inicio`, `:dt_fim`, `:co_cnes`
> Adapte os nomes de tabelas/colunas conforme a versão do e-SUS instalada.

---

## Q001 — Gestantes Ativas da Equipe

```sql
-- Q001 — Lista de gestantes ativas vinculadas à equipe
-- Parâmetros: :nu_ine
SELECT
    c.no_cidadao                                        AS nome,
    c.nu_cns                                            AS cns,
    c.nu_cpf                                            AS cpf,
    TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY')              AS data_nascimento,
    TO_CHAR(pn.dt_dum, 'DD/MM/YYYY')                    AS dum,
    TO_CHAR(pn.dt_dpp, 'DD/MM/YYYY')                    AS dpp,
    pn.nu_semanas_gestacao                              AS ig_atual,
    pn.nu_consultas_realizadas                          AS consultas,
    TO_CHAR(pn.dt_inicio_pre_natal, 'DD/MM/YYYY')       AS data_1a_consulta
FROM sch_atendimento.tb_pre_natal pn
JOIN sch_cidadao.tb_cidadao c ON c.co_seq_cidadao = pn.co_cidadao
WHERE pn.co_equipe = :nu_ine
  AND pn.st_ativo = TRUE
  AND pn.dt_desfecho IS NULL
ORDER BY pn.dt_dpp ASC;
```

---

## Q002 — Indicador I1: Gestantes SEM Pré-natal no 1º Trimestre

```sql
-- Q002 — Gestantes no denominador mas sem consulta antes de 12 semanas (numerador I1)
-- Parâmetros: :nu_ine, :dt_inicio (início do ano), :dt_fim (fim do período)
SELECT
    c.no_cidadao                                AS nome,
    c.nu_cns                                    AS cns,
    c.nu_cpf                                    AS cpf,
    TO_CHAR(pn.dt_dum, 'DD/MM/YYYY')            AS dum,
    pn.nu_semanas_gestacao                      AS ig_na_1a_consulta,
    TO_CHAR(pn.dt_inicio_pre_natal,'DD/MM/YYYY') AS data_1a_consulta,
    CASE WHEN pn.nu_semanas_gestacao <= 12
         THEN 'SIM — já conta no numerador'
         ELSE 'NÃO — iniciou tardio (IG ' || pn.nu_semanas_gestacao || ' sem.)'
    END AS situacao_i1
FROM sch_atendimento.tb_pre_natal pn
JOIN sch_cidadao.tb_cidadao c ON c.co_seq_cidadao = pn.co_cidadao
WHERE pn.co_equipe = :nu_ine
  AND pn.dt_inicio_pre_natal BETWEEN :dt_inicio AND :dt_fim
  AND (pn.nu_semanas_gestacao > 12 OR pn.nu_semanas_gestacao IS NULL)
ORDER BY c.no_cidadao;
```

---

## Q003 — Indicador I3: Gestantes SEM Exame de Sífilis e HIV

```sql
-- Q003 — Gestantes sem exame de sífilis OU sem exame de HIV no período
-- Parâmetros: :nu_ine, :dt_inicio, :dt_fim
SELECT
    c.no_cidadao                                AS nome,
    c.nu_cns                                    AS cns,
    TO_CHAR(pn.dt_dpp, 'DD/MM/YYYY')            AS dpp,
    COALESCE(ex_sif.dt_resultado::TEXT, 'SEM EXAME') AS sifilis,
    COALESCE(ex_hiv.dt_resultado::TEXT, 'SEM EXAME') AS hiv
FROM sch_atendimento.tb_pre_natal pn
JOIN sch_cidadao.tb_cidadao c ON c.co_seq_cidadao = pn.co_cidadao
LEFT JOIN sch_atendimento.tb_exame_gestante ex_sif
    ON ex_sif.co_pre_natal = pn.co_seq_pre_natal AND ex_sif.co_tipo_exame = 1
LEFT JOIN sch_atendimento.tb_exame_gestante ex_hiv
    ON ex_hiv.co_pre_natal = pn.co_seq_pre_natal AND ex_hiv.co_tipo_exame = 2
WHERE pn.co_equipe = :nu_ine
  AND pn.dt_inicio_pre_natal BETWEEN :dt_inicio AND :dt_fim
  AND (ex_sif.co_seq_resultado IS NULL OR ex_hiv.co_seq_resultado IS NULL)
ORDER BY c.no_cidadao;
```

---

## Q004 — Indicador I5: Mulheres SEM Citopatológico (25–64 anos)

```sql
-- Q004 — Mulheres 25-64 anos sem citopatológico nos últimos 3 anos
-- Parâmetros: :nu_ine
SELECT
    c.no_cidadao                                            AS nome,
    c.nu_cns                                                AS cns,
    c.nu_cpf                                                AS cpf,
    TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY')                  AS data_nascimento,
    DATE_PART('year', AGE(c.dt_nascimento))::INT            AS idade,
    COALESCE(
        TO_CHAR(MAX(re.dt_resultado), 'DD/MM/YYYY'),
        'NUNCA REALIZADO'
    )                                                       AS ultimo_citopatologico,
    COALESCE(
        DATE_PART('year', AGE(MAX(re.dt_resultado)))::TEXT || ' anos atrás',
        'Sem registro'
    )                                                       AS tempo_desde_ultimo
FROM sch_cidadao.tb_cidadao c
JOIN sch_cidadao.tb_vinculo_equipe_cidadao v
    ON v.co_cidadao = c.co_seq_cidadao AND v.st_ativo = TRUE
LEFT JOIN sch_exame.tb_resultado_exame re
    ON re.co_cidadao = c.co_seq_cidadao
    AND re.co_sigtap = '0203010086'  -- Citopatológico colo uterino
WHERE v.nu_ine = :nu_ine
  AND c.co_sexo = 'F'
  AND DATE_PART('year', AGE(c.dt_nascimento)) BETWEEN 25 AND 64
  AND c.dt_obito IS NULL
  AND c.st_ativo = TRUE
GROUP BY c.co_seq_cidadao, c.no_cidadao, c.nu_cns, c.nu_cpf, c.dt_nascimento
HAVING MAX(re.dt_resultado) < CURRENT_DATE - INTERVAL '3 years'
    OR MAX(re.dt_resultado) IS NULL
ORDER BY c.no_cidadao;
```

---

## Q005 — Indicador I6: Hipertensos SEM PA Aferida no Semestre

```sql
-- Q005 — Hipertensos sem aferição de PA nos últimos 6 meses
-- Parâmetros: :nu_ine
SELECT
    c.no_cidadao                                        AS nome,
    c.nu_cns                                            AS cns,
    c.nu_cpf                                            AS cpf,
    DATE_PART('year', AGE(c.dt_nascimento))::INT        AS idade,
    COALESCE(
        TO_CHAR(MAX(m.dt_medicao), 'DD/MM/YYYY'),
        'SEM REGISTRO'
    )                                                   AS ultima_pa,
    COALESCE(
        MAX(m.nu_pressao_sistolica)::TEXT || '/' ||
        MAX(m.nu_pressao_diastolica)::TEXT || ' mmHg',
        '—'
    )                                                   AS ultima_pa_valor
FROM sch_cidadao.tb_condicao_saude cs
JOIN sch_cidadao.tb_cidadao c ON c.co_seq_cidadao = cs.co_cidadao
JOIN sch_cidadao.tb_vinculo_equipe_cidadao v
    ON v.co_cidadao = c.co_seq_cidadao AND v.st_ativo = TRUE
LEFT JOIN sch_atendimento.tb_medicao m
    ON m.co_cidadao = c.co_seq_cidadao
    AND m.dt_medicao >= CURRENT_DATE - INTERVAL '6 months'
    AND m.nu_pressao_sistolica IS NOT NULL
WHERE v.nu_ine = :nu_ine
  AND cs.st_ativo = TRUE
  AND (cs.co_ciap2 IN ('K86','K87') OR cs.co_cid10 LIKE 'I1%')
  AND c.dt_obito IS NULL
GROUP BY c.co_seq_cidadao, c.no_cidadao, c.nu_cns, c.nu_cpf, c.dt_nascimento
HAVING MAX(m.dt_medicao) IS NULL
    OR MAX(m.dt_medicao) < CURRENT_DATE - INTERVAL '6 months'
ORDER BY ultima_pa ASC NULLS FIRST;
```

---

## Q006 — Indicador I7: Diabéticos SEM HbA1c no Semestre

```sql
-- Q006 — Diabéticos sem solicitação de HbA1c nos últimos 6 meses
-- Parâmetros: :nu_ine
SELECT
    c.no_cidadao                                        AS nome,
    c.nu_cns                                            AS cns,
    c.nu_cpf                                            AS cpf,
    DATE_PART('year', AGE(c.dt_nascimento))::INT        AS idade,
    COALESCE(
        TO_CHAR(MAX(re.dt_solicitacao), 'DD/MM/YYYY'),
        'SEM SOLICITAÇÃO'
    )                                                   AS ultima_hba1c_solicitada,
    COALESCE(
        TO_CHAR(MAX(re.dt_resultado), 'DD/MM/YYYY'),
        'SEM RESULTADO'
    )                                                   AS ultimo_resultado
FROM sch_cidadao.tb_condicao_saude cs
JOIN sch_cidadao.tb_cidadao c ON c.co_seq_cidadao = cs.co_cidadao
JOIN sch_cidadao.tb_vinculo_equipe_cidadao v
    ON v.co_cidadao = c.co_seq_cidadao AND v.st_ativo = TRUE
LEFT JOIN sch_exame.tb_resultado_exame re
    ON re.co_cidadao = c.co_seq_cidadao
    AND re.co_sigtap = '0202010910'  -- HbA1c
    AND re.dt_solicitacao >= CURRENT_DATE - INTERVAL '6 months'
WHERE v.nu_ine = :nu_ine
  AND cs.st_ativo = TRUE
  AND (cs.co_ciap2 IN ('T89','T90') OR cs.co_cid10 IN ('E10','E11','E12','E13','E14'))
  AND c.dt_obito IS NULL
GROUP BY c.co_seq_cidadao, c.no_cidadao, c.nu_cns, c.nu_cpf, c.dt_nascimento
HAVING MAX(re.co_seq_resultado) IS NULL
ORDER BY c.no_cidadao;
```

---

## Q007 — Indicador I8: Crianças 1 Ano SEM Vacinas em Dia

```sql
-- Q007 — Crianças com ~1 ano de idade sem vacina poliomielite ou penta completa
-- Parâmetros: :nu_ine
SELECT
    c.no_cidadao                                    AS nome,
    c.nu_cns                                        AS cns,
    TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY')          AS data_nascimento,
    DATE_PART('month', AGE(c.dt_nascimento))::INT   AS idade_meses,
    -- Poliomielite
    COUNT(CASE WHEN ia.co_imunobiologico IN (25,26,97) THEN 1 END) AS doses_polio,
    -- Pentavalente
    COUNT(CASE WHEN ia.co_imunobiologico = 87 THEN 1 END)          AS doses_penta,
    CASE
        WHEN COUNT(CASE WHEN ia.co_imunobiologico IN (25,26,97) THEN 1 END) >= 3
         AND COUNT(CASE WHEN ia.co_imunobiologico = 87 THEN 1 END) >= 3
        THEN '✅ Completo'
        ELSE '❌ Incompleto'
    END AS status_vacinal
FROM sch_cidadao.tb_cidadao c
JOIN sch_cidadao.tb_vinculo_equipe_cidadao v
    ON v.co_cidadao = c.co_seq_cidadao AND v.st_ativo = TRUE
LEFT JOIN sch_imunobiologico.tb_imunobiologico_administrado ia
    ON ia.co_cidadao = c.co_seq_cidadao
WHERE v.nu_ine = :nu_ine
  AND DATE_PART('year', AGE(c.dt_nascimento)) = 1  -- Crianças com 1 ano completo
  AND c.dt_obito IS NULL
GROUP BY c.co_seq_cidadao, c.no_cidadao, c.nu_cns, c.dt_nascimento
HAVING
    COUNT(CASE WHEN ia.co_imunobiologico IN (25,26,97) THEN 1 END) < 3
    OR COUNT(CASE WHEN ia.co_imunobiologico = 87 THEN 1 END) < 3
ORDER BY c.dt_nascimento DESC;
```

---

## Q008 — Painel Geral: Todos os Indicadores em Uma Query

```sql
-- Q008 — Resumo de todos os indicadores com numerador, denominador e percentual
-- Parâmetros: :nu_ine, :ano_competencia (ex: 2024)
WITH
-- I1: Pré-natal 1º trimestre
i1 AS (
    SELECT
        'I1' AS indicador,
        'Pré-natal no 1º trimestre' AS nome,
        COUNT(*) FILTER (WHERE nu_semanas_gestacao <= 12) AS numerador,
        COUNT(*) AS denominador
    FROM sch_atendimento.tb_pre_natal
    WHERE co_equipe = :nu_ine
      AND EXTRACT(YEAR FROM dt_inicio_pre_natal) = :ano_competencia
),
-- I5: Citopatológico (simplificado — ajuste conforme banco)
i5 AS (
    SELECT
        'I5' AS indicador,
        'Citopatológico (25-64 anos)' AS nome,
        COUNT(*) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM sch_exame.tb_resultado_exame re2
                WHERE re2.co_cidadao = c.co_seq_cidadao
                  AND re2.co_sigtap = '0203010086'
                  AND re2.dt_resultado >= CURRENT_DATE - INTERVAL '3 years'
            )
        ) AS numerador,
        COUNT(*) AS denominador
    FROM sch_cidadao.tb_cidadao c
    JOIN sch_cidadao.tb_vinculo_equipe_cidadao v
        ON v.co_cidadao = c.co_seq_cidadao AND v.nu_ine = :nu_ine AND v.st_ativo = TRUE
    WHERE c.co_sexo = 'F'
      AND DATE_PART('year', AGE(c.dt_nascimento)) BETWEEN 25 AND 64
      AND c.dt_obito IS NULL
)
SELECT
    indicador,
    nome,
    numerador,
    denominador,
    ROUND((numerador::NUMERIC / NULLIF(denominador, 0)) * 100, 1) AS percentual,
    CASE
        WHEN (numerador::NUMERIC / NULLIF(denominador, 0)) >= 0.90 THEN '🟢 ÓTIMO'
        WHEN (numerador::NUMERIC / NULLIF(denominador, 0)) >= 0.70 THEN '🟡 BOM'
        WHEN (numerador::NUMERIC / NULLIF(denominador, 0)) >= 0.60 THEN '🟠 SUFICIENTE'
        ELSE '🔴 ABAIXO DA META'
    END AS classificacao
FROM (
    SELECT * FROM i1
    UNION ALL SELECT * FROM i5
    -- adicionar demais indicadores aqui
) resumo
ORDER BY indicador;
```
