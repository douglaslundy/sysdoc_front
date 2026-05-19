-- ================================================================
-- SEED: Dados fictícios para desenvolvimento
-- Município: Ilicínea/MG | CNES: 2794454
-- Período: 2025 (foco no 2° quadrimestre: mai-ago/2025)
-- ================================================================

-- Dimensão: Unidade de Saúde
INSERT INTO dim_unidade_saude (nu_cnes, no_unidade_saude, co_municipio_ibge)
VALUES ('2794454', 'UBS CENTRO ILICÍNEA', '3131703');

-- Dimensão: Equipes
INSERT INTO dim_equipe (nu_ine, no_equipe, tp_equipe, nu_cnes, st_ativo) VALUES
('0000000001', 'ESF CENTRO',      70, '2794454', true),
('0000000002', 'ESF VILA NOVA',   70, '2794454', true),
('0000000003', 'ESB CENTRO',      72, '2794454', true);

-- Dimensão: CBO (profissionais relevantes)
INSERT INTO dim_cbo (nu_cbo, no_cbo) VALUES
('225142', 'MÉDICO DE FAMÍLIA E COMUNIDADE'),
('223505', 'ENFERMEIRO'),
('516220', 'AGENTE COMUNITÁRIO DE SAÚDE'),
('223208', 'CIRURGIÃO-DENTISTA'),
('322220', 'TÉCNICO DE ENFERMAGEM');

-- Dimensão: CID-10 relevantes
INSERT INTO dim_cid10 (nu_cid10, no_cid10) VALUES
('I10',  'Hipertensão essencial'),
('E119', 'Diabetes mellitus tipo 2 sem complicações'),
('Z349', 'Supervisão de gravidez normal, não especificada'),
('F329', 'Episódio depressivo não especificado');

-- Dimensão: CIAP-2 relevantes
INSERT INTO dim_ciap2 (nu_ciap2, no_ciap2) VALUES
('K86',  'Hipertensão sem complicação cardíaca'),
('T90',  'Diabetes não insulino-dependente'),
('W78',  'Gravidez'),
('P76',  'Transtorno depressivo');

-- Dimensão: Tempo (gerar datas do 2° quad/2025: mai-ago)
INSERT INTO dim_tempo (dt_registro, nu_dia, nu_mes, nu_ano, nu_quadrimestre, nu_competencia)
SELECT
  d::date,
  EXTRACT(DAY FROM d)::int,
  EXTRACT(MONTH FROM d)::int,
  EXTRACT(YEAR FROM d)::int,
  CASE
    WHEN EXTRACT(MONTH FROM d) BETWEEN 1 AND 4 THEN 1
    WHEN EXTRACT(MONTH FROM d) BETWEEN 5 AND 8 THEN 2
    ELSE 3
  END,
  (EXTRACT(YEAR FROM d)::int * 100 + EXTRACT(MONTH FROM d)::int)::int
FROM generate_series('2025-01-01'::date, '2025-08-31'::date, '1 day'::interval) d
ON CONFLICT (dt_registro) DO NOTHING;

-- Usuário de leitura para o módulo
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'monitor_aps_reader') THEN
    CREATE ROLE monitor_aps_reader;
  END IF;
END $$;
GRANT CONNECT ON DATABASE esus TO monitor_aps_reader;
GRANT USAGE ON SCHEMA public TO monitor_aps_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitor_aps_reader;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'monitor_aps') THEN
    CREATE USER monitor_aps WITH PASSWORD 'monitor123';
  END IF;
END $$;
GRANT monitor_aps_reader TO monitor_aps;

-- ================================================================
-- CIDADÃOS: 300 cadastros distribuídos entre as 2 equipes eSF
-- ================================================================
DO $$
DECLARE
  v_equipe1 BIGINT := (SELECT co_seq_dim_equipe FROM dim_equipe WHERE nu_ine = '0000000001');
  v_equipe2 BIGINT := (SELECT co_seq_dim_equipe FROM dim_equipe WHERE nu_ine = '0000000002');
  v_tempo   BIGINT := (SELECT co_seq_dim_tempo FROM dim_tempo WHERE dt_registro = '2025-01-15');
  i         INTEGER;
  v_equipe  BIGINT;
  v_nasc    DATE;
BEGIN
  FOR i IN 1..300 LOOP
    v_equipe := CASE WHEN i <= 150 THEN v_equipe1 ELSE v_equipe2 END;
    v_nasc := CASE
      WHEN i % 10 = 0 THEN CURRENT_DATE - (INTERVAL '1 year' * (i % 24))
      WHEN i % 8 = 0  THEN CURRENT_DATE - (INTERVAL '1 year' * (3 + i % 57))
      WHEN i % 6 = 0  THEN CURRENT_DATE - (INTERVAL '1 year' * (60 + i % 30))
      ELSE CURRENT_DATE - (INTERVAL '1 year' * (18 + i % 42))
    END;
    INSERT INTO fat_cad_individual (
      co_dim_equipe, co_dim_tempo, co_cidadao,
      dt_nascimento, st_feminino, st_bolsa_familia, st_bpc, st_ativo
    ) VALUES (
      v_equipe, v_tempo, 1000 + i,
      v_nasc,
      (i % 2 = 0),
      (i % 7 = 0),
      (i % 20 = 0),
      true
    );
  END LOOP;
END $$;

-- ================================================================
-- ATENDIMENTOS: 2° quadrimestre 2025 (mai-ago)
-- ESF CENTRO: indicadores RUINS (para testar alertas)
-- ESF VILA NOVA: indicadores BONS (para comparação)
-- ================================================================
DO $$
DECLARE
  v_eq1     BIGINT := (SELECT co_seq_dim_equipe FROM dim_equipe WHERE nu_ine = '0000000001');
  v_eq2     BIGINT := (SELECT co_seq_dim_equipe FROM dim_equipe WHERE nu_ine = '0000000002');
  v_uns     BIGINT := (SELECT co_seq_dim_uns FROM dim_unidade_saude WHERE nu_cnes = '2794454');
  v_med     BIGINT := (SELECT co_seq_dim_cbo FROM dim_cbo WHERE nu_cbo = '225142');
  v_enf     BIGINT := (SELECT co_seq_dim_cbo FROM dim_cbo WHERE nu_cbo = '223505');
  v_acs     BIGINT := (SELECT co_seq_dim_cbo FROM dim_cbo WHERE nu_cbo = '516220');
  v_has_c   BIGINT := (SELECT co_seq_dim_ciap2 FROM dim_ciap2 WHERE nu_ciap2 = 'K86');
  v_dm_c    BIGINT := (SELECT co_seq_dim_ciap2 FROM dim_ciap2 WHERE nu_ciap2 = 'T90');
  v_dt      BIGINT;
  i         INTEGER;
BEGIN
  -- EQUIPE 1 (ESF CENTRO): poucos atendimentos = indicadores ruins
  FOR i IN 1001..1050 LOOP
    SELECT co_seq_dim_tempo INTO v_dt FROM dim_tempo
      WHERE nu_ano = 2025 AND nu_mes = 5 + (i % 4)
      ORDER BY RANDOM() LIMIT 1;
    INSERT INTO fat_atendimento_individual
      (co_dim_equipe, co_dim_unidade_saude, co_dim_cbo, co_dim_tempo, co_cidadao, co_dim_tipo_atendimento, co_dim_ciap2_avaliado)
    VALUES (v_eq1, v_uns, v_med, v_dt, i, 1 + (i % 5),
      CASE WHEN i % 5 = 0 THEN v_has_c WHEN i % 7 = 0 THEN v_dm_c ELSE NULL END);
  END LOOP;

  -- EQUIPE 2 (ESF VILA NOVA): muitos atendimentos = indicadores bons
  FOR i IN 1151..1300 LOOP
    SELECT co_seq_dim_tempo INTO v_dt FROM dim_tempo
      WHERE nu_ano = 2025 AND nu_mes = 5 + (i % 4)
      ORDER BY RANDOM() LIMIT 1;
    INSERT INTO fat_atendimento_individual
      (co_dim_equipe, co_dim_unidade_saude, co_dim_cbo, co_dim_tempo, co_cidadao, co_dim_tipo_atendimento, co_dim_ciap2_avaliado)
    VALUES (v_eq2, v_uns, CASE WHEN i % 3 = 0 THEN v_enf ELSE v_med END,
      v_dt, i, 1 + (i % 5),
      CASE WHEN i % 4 = 0 THEN v_has_c WHEN i % 6 = 0 THEN v_dm_c ELSE NULL END);
    IF i % 2 = 0 THEN
      SELECT co_seq_dim_tempo INTO v_dt FROM dim_tempo
        WHERE nu_ano = 2025 AND nu_mes = 7 ORDER BY RANDOM() LIMIT 1;
      INSERT INTO fat_atendimento_individual
        (co_dim_equipe, co_dim_unidade_saude, co_dim_cbo, co_dim_tempo, co_cidadao, co_dim_tipo_atendimento)
      VALUES (v_eq2, v_uns, v_med, v_dt, i, 2);
    END IF;
  END LOOP;

  -- VISITAS DOMICILIARES ACS — equipe 2 bem melhor
  FOR i IN 1151..1280 LOOP
    SELECT co_seq_dim_tempo INTO v_dt FROM dim_tempo
      WHERE nu_ano = 2025 AND nu_mes = 5 + (i % 3) ORDER BY RANDOM() LIMIT 1;
    INSERT INTO fat_visita_domiciliar
      (co_dim_equipe, co_dim_tempo, co_dim_cbo, co_cidadao, st_visita_realizada)
    VALUES (v_eq2, v_dt, v_acs, i, true);
  END LOOP;
  -- Equipe 1: poucas visitas
  FOR i IN 1001..1030 LOOP
    SELECT co_seq_dim_tempo INTO v_dt FROM dim_tempo
      WHERE nu_ano = 2025 AND nu_mes = 6 ORDER BY RANDOM() LIMIT 1;
    INSERT INTO fat_visita_domiciliar
      (co_dim_equipe, co_dim_tempo, co_dim_cbo, co_cidadao, st_visita_realizada)
    VALUES (v_eq1, v_dt, v_acs, i, true);
  END LOOP;
END $$;

-- ATENDIMENTOS ODONTOLÓGICOS (eSB)
DO $$
DECLARE
  v_esb   BIGINT := (SELECT co_seq_dim_equipe FROM dim_equipe WHERE nu_ine = '0000000003');
  v_dt    BIGINT;
  i       INTEGER;
BEGIN
  FOR i IN 1001..1080 LOOP
    SELECT co_seq_dim_tempo INTO v_dt FROM dim_tempo
      WHERE nu_ano = 2025 AND nu_mes = 5 + (i % 4) ORDER BY RANDOM() LIMIT 1;
    INSERT INTO fat_atendimento_odontologico
      (co_dim_equipe, co_dim_tempo, co_cidadao, st_primeira_consulta, st_conclusao_tratamento)
    VALUES (v_esb, v_dt, i,
      (i % 3 = 0),
      (i % 5 = 0));
  END LOOP;
END $$;

-- Refresh das views (garantir que estão populadas)
ANALYZE fat_atendimento_individual;
ANALYZE fat_cad_individual;
ANALYZE fat_visita_domiciliar;
