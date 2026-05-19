-- ================================================================
-- Correções ao schema dev: índices compostos, fat_vacinacao,
-- views enriquecidas com colunas do PEC real (nullable quando
-- o dado real não existe no dev).
-- ================================================================

-- ----------------------------------------------------------------
-- 1. ÍNDICES AUSENTES
-- ----------------------------------------------------------------

-- Padrão mais comum em todas as queries: equipe + período
CREATE INDEX IF NOT EXISTS idx_fat_atd_equipe_tempo
  ON fat_atendimento_individual(co_dim_equipe, co_dim_tempo);

-- Filtro por ACS nas visitas (Indicador 8)
CREATE INDEX IF NOT EXISTS idx_fat_vis_cbo
  ON fat_visita_domiciliar(co_dim_cbo);

-- Agrupamentos etários: crianças, idosos (Indicadores 2, 6)
CREATE INDEX IF NOT EXISTS idx_fat_cad_nascimento
  ON fat_cad_individual(dt_nascimento);

-- Busca por código SIGTAP de vacinas (Indicadores 2, 9)
CREATE INDEX IF NOT EXISTS idx_fat_proc_sigtap
  ON fat_procedimento_individual(nu_sigtap);

-- ----------------------------------------------------------------
-- 2. TABELA fat_vacinacao (ausente no dev, crítica para ind. 2 e 9)
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fat_vacinacao (
  co_seq_fat_vac      BIGSERIAL PRIMARY KEY,
  co_dim_equipe       BIGINT REFERENCES dim_equipe(co_seq_dim_equipe),
  co_dim_tempo        BIGINT REFERENCES dim_tempo(co_seq_dim_tempo),
  co_cidadao          BIGINT NOT NULL,
  nu_cbo              VARCHAR(6),      -- profissional que aplicou
  nu_sigtap_imuno     VARCHAR(10),     -- código do imunobiológico
  nu_dose             INTEGER DEFAULT 1,
  st_realizado        BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_fat_vac_equipe
  ON fat_vacinacao(co_dim_equipe);
CREATE INDEX IF NOT EXISTS idx_fat_vac_sigtap
  ON fat_vacinacao(nu_sigtap_imuno);
CREATE INDEX IF NOT EXISTS idx_fat_vac_cidadao
  ON fat_vacinacao(co_cidadao);

-- Seed: vacinas para crianças <2 anos da ESF VILA NOVA (indicadores bons)
-- e cobertura parcial na ESF CENTRO (indicadores ruins)
DO $$
DECLARE
  v_eq1   BIGINT := (SELECT co_seq_dim_equipe FROM dim_equipe WHERE nu_ine = '0000000001');
  v_eq2   BIGINT := (SELECT co_seq_dim_equipe FROM dim_equipe WHERE nu_ine = '0000000002');
  v_dt    BIGINT;
  i       INTEGER;
  -- SIGTAP: DTP, HepB, Hib, Pólio, SCR (tríplice viral), Pneumocócica 10v
  vacinas VARCHAR(10)[] := ARRAY['0301060029','0301060100','0301060037',
                                  '0301060118','0301060196','0301060160'];
  v_vac   VARCHAR(10);
BEGIN
  -- ESF VILA NOVA: crianças 0-2 anos (cidadãos cujo i%10=0 no seed)
  -- Vacinação completa (todas as vacinas)
  FOREACH v_vac IN ARRAY vacinas LOOP
    FOR i IN 1151..1300 LOOP
      -- Apenas crianças (nascidas nos últimos 2 anos via regra do seed: i%10=0)
      CONTINUE WHEN i % 10 != 0;
      SELECT co_seq_dim_tempo INTO v_dt FROM dim_tempo
        WHERE nu_ano = 2025 AND nu_mes IN (5,6) ORDER BY RANDOM() LIMIT 1;
      INSERT INTO fat_vacinacao
        (co_dim_equipe, co_dim_tempo, co_cidadao, nu_cbo, nu_sigtap_imuno, st_realizado)
      VALUES (v_eq2, v_dt, i, '322220', v_vac, true);
    END LOOP;
  END LOOP;

  -- ESF CENTRO: crianças 0-2 anos — vacinação incompleta (apenas DTP e HepB)
  FOR i IN 1001..1150 LOOP
    CONTINUE WHEN i % 10 != 0;
    SELECT co_seq_dim_tempo INTO v_dt FROM dim_tempo
      WHERE nu_ano = 2025 AND nu_mes = 6 ORDER BY RANDOM() LIMIT 1;
    -- Só DTP e HepB (incompleto)
    INSERT INTO fat_vacinacao
      (co_dim_equipe, co_dim_tempo, co_cidadao, nu_cbo, nu_sigtap_imuno, st_realizado)
    VALUES
      (v_eq1, v_dt, i, '322220', '0301060029', true),
      (v_eq1, v_dt, i, '322220', '0301060100', true);
  END LOOP;
END $$;

-- ----------------------------------------------------------------
-- 3. VIEWS ENRIQUECIDAS
-- Views agora têm as mesmas colunas do PEC real. Quando o dado
-- não existe no dev, o campo retorna NULL (documentado).
-- ----------------------------------------------------------------

-- vw_acompanhamento_pre_natal
CREATE OR REPLACE VIEW vw_acompanhamento_pre_natal AS
SELECT
  de.nu_ine,
  de.no_equipe,
  fai.co_cidadao,
  COUNT(DISTINCT fai.co_seq_fat_atd_ind)                             AS nu_consultas_pn,
  MIN(dt.dt_registro)                                                AS dt_inicio_pn,
  MAX(dt.dt_registro)                                                AS dt_ultimo_atendimento,
  CASE WHEN COUNT(DISTINCT fai.co_seq_fat_atd_ind) >= 6
       THEN true ELSE false END                                      AS st_pn_adequado,
  -- Colunas presentes no PEC real; ausentes no dev (NULL explícito)
  false                   AS st_consulta_puerperal,
  NULL::boolean           AS st_vacinacao_hepatite_b,
  NULL::boolean           AS st_vacinacao_influenza,
  NULL::boolean           AS st_exame_sifilis,
  NULL::boolean           AS st_exame_hiv,
  NULL::boolean           AS st_exame_glucose
FROM fat_atendimento_individual fai
JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_tempo  dt ON fai.co_dim_tempo  = dt.co_seq_dim_tempo
JOIN dim_ciap2  dc ON fai.co_dim_ciap2_avaliado = dc.co_seq_dim_ciap2
WHERE dc.nu_ciap2 IN ('W78','W79','W84')
GROUP BY de.nu_ine, de.no_equipe, fai.co_cidadao;

-- vw_acompanhamento_hipertensao
CREATE OR REPLACE VIEW vw_acompanhamento_hipertensao AS
SELECT
  de.nu_ine,
  de.no_equipe,
  fai.co_cidadao,
  COUNT(DISTINCT fai.co_seq_fat_atd_ind)                             AS nu_consultas_ultimo_ano,
  MAX(dt.dt_registro)                                                AS dt_ultimo_atendimento,
  CASE WHEN COUNT(DISTINCT fai.co_seq_fat_atd_ind) >= 2
       THEN true ELSE false END                                      AS st_acompanhado,
  -- No PEC real: st_controlado = PA < 140x90. No dev: proxy = st_acompanhado
  CASE WHEN COUNT(DISTINCT fai.co_seq_fat_atd_ind) >= 2
       THEN true ELSE false END                                      AS st_controlado,
  NULL::numeric           AS nu_ultima_pa_sistolica,
  NULL::numeric           AS nu_ultima_pa_diastolica
FROM fat_atendimento_individual fai
JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_tempo  dt ON fai.co_dim_tempo  = dt.co_seq_dim_tempo
LEFT JOIN dim_ciap2 dc ON fai.co_dim_ciap2_avaliado = dc.co_seq_dim_ciap2
LEFT JOIN dim_cid10 di ON fai.co_dim_cid10_avaliado = di.co_seq_dim_cid10
WHERE (dc.nu_ciap2 IN ('K86','K87') OR di.nu_cid10 LIKE 'I1%')
GROUP BY de.nu_ine, de.no_equipe, fai.co_cidadao;

-- vw_acompanhamento_diabetes
CREATE OR REPLACE VIEW vw_acompanhamento_diabetes AS
SELECT
  de.nu_ine,
  de.no_equipe,
  fai.co_cidadao,
  COUNT(DISTINCT fai.co_seq_fat_atd_ind)                             AS nu_consultas_ultimo_ano,
  MAX(dt.dt_registro)                                                AS dt_ultimo_atendimento,
  CASE WHEN COUNT(DISTINCT fai.co_seq_fat_atd_ind) >= 2
       THEN true ELSE false END                                      AS st_acompanhado,
  -- No PEC real: st_controlado = HbA1c < 7%. No dev: proxy = st_acompanhado
  CASE WHEN COUNT(DISTINCT fai.co_seq_fat_atd_ind) >= 2
       THEN true ELSE false END                                      AS st_controlado,
  NULL::numeric           AS nu_ultima_glicemia,
  NULL::boolean           AS st_hba1c_realizado
FROM fat_atendimento_individual fai
JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_tempo  dt ON fai.co_dim_tempo  = dt.co_seq_dim_tempo
LEFT JOIN dim_ciap2 dc ON fai.co_dim_ciap2_avaliado = dc.co_seq_dim_ciap2
LEFT JOIN dim_cid10 di ON fai.co_dim_cid10_avaliado = di.co_seq_dim_cid10
WHERE (dc.nu_ciap2 = 'T90' OR di.nu_cid10 LIKE 'E1%')
GROUP BY de.nu_ine, de.no_equipe, fai.co_cidadao;

-- vw_cobertura_cadastral (adiciona pct_completude e nu_cadastros_atualizados_12m)
CREATE OR REPLACE VIEW vw_cobertura_cadastral AS
SELECT
  de.nu_ine,
  de.no_equipe,
  de.nu_cnes,
  COUNT(DISTINCT fci.co_cidadao)                                     AS nu_cadastros_individuais,
  COUNT(DISTINCT fcd.co_cidadao_responsavel)                         AS nu_cadastros_domiciliares,
  COUNT(DISTINCT CASE
    WHEN fci.dt_nascimento > CURRENT_DATE - INTERVAL '5 years'
    THEN fci.co_cidadao END)                                         AS nu_criancas_0_5,
  COUNT(DISTINCT CASE
    WHEN fci.dt_nascimento < CURRENT_DATE - INTERVAL '60 years'
    THEN fci.co_cidadao END)                                         AS nu_idosos_60_mais,
  COUNT(DISTINCT CASE WHEN fci.st_bolsa_familia THEN fci.co_cidadao END) AS nu_bolsa_familia,
  COUNT(DISTINCT CASE WHEN fci.st_bpc          THEN fci.co_cidadao END) AS nu_bpc,
  -- pct_completude: score da portaria (1,5 pts com domiciliar / 0,75 só individual)
  ROUND(
    (COUNT(DISTINCT CASE WHEN fcd.co_cidadao_responsavel IS NOT NULL
                         THEN fci.co_cidadao END)::numeric * 1.5
     + COUNT(DISTINCT CASE WHEN fcd.co_cidadao_responsavel IS NULL
                           THEN fci.co_cidadao END)::numeric * 0.75)
    / NULLIF(COUNT(DISTINCT fci.co_cidadao)::numeric * 1.5, 0) * 100
  , 1)                                                                AS pct_completude,
  -- Cadastros com atualização nos últimos 12 meses
  COUNT(DISTINCT CASE
    WHEN dtc.dt_registro >= CURRENT_DATE - INTERVAL '12 months'
    THEN fci.co_cidadao END)                                          AS nu_cadastros_atualizados_12m
FROM fat_cad_individual fci
JOIN dim_equipe de  ON fci.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_tempo  dtc ON fci.co_dim_tempo  = dtc.co_seq_dim_tempo
LEFT JOIN fat_cad_domiciliar fcd ON fci.co_cidadao = fcd.co_cidadao_responsavel
WHERE fci.st_ativo = true
GROUP BY de.nu_ine, de.no_equipe, de.nu_cnes;

-- ANALYZE para atualizar estatísticas
ANALYZE fat_vacinacao;
