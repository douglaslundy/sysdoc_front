-- ================================================================
-- Schema DW eSUS APS PEC — Ambiente de Desenvolvimento/Teste
-- Baseado na documentação DW PEC v7.4.0
-- ================================================================

-- DIMENSÕES

CREATE TABLE IF NOT EXISTS dim_equipe (
  co_seq_dim_equipe   BIGSERIAL PRIMARY KEY,
  nu_ine              VARCHAR(10) NOT NULL,
  no_equipe           VARCHAR(100),
  tp_equipe           INTEGER,   -- 70=eSF, 71=eAP, 72=eSB, 80=eMulti
  nu_cnes             VARCHAR(7),
  st_ativo            BOOLEAN DEFAULT true,
  UNIQUE(nu_ine)
);

CREATE TABLE IF NOT EXISTS dim_unidade_saude (
  co_seq_dim_uns      BIGSERIAL PRIMARY KEY,
  nu_cnes             VARCHAR(7) NOT NULL,
  no_unidade_saude    VARCHAR(100),
  co_municipio_ibge   VARCHAR(7),
  UNIQUE(nu_cnes)
);

CREATE TABLE IF NOT EXISTS dim_tempo (
  co_seq_dim_tempo    BIGSERIAL PRIMARY KEY,
  dt_registro         DATE NOT NULL,
  nu_dia              INTEGER,
  nu_mes              INTEGER,
  nu_ano              INTEGER,
  nu_quadrimestre     INTEGER,  -- 1=jan-abr, 2=mai-ago, 3=set-dez
  nu_competencia      INTEGER,  -- AAAAMM ex: 202506
  UNIQUE(dt_registro)
);

CREATE TABLE IF NOT EXISTS dim_cbo (
  co_seq_dim_cbo      BIGSERIAL PRIMARY KEY,
  nu_cbo              VARCHAR(6) NOT NULL,
  no_cbo              VARCHAR(100),
  UNIQUE(nu_cbo)
);

CREATE TABLE IF NOT EXISTS dim_cid10 (
  co_seq_dim_cid10    BIGSERIAL PRIMARY KEY,
  nu_cid10            VARCHAR(5) NOT NULL,
  no_cid10            VARCHAR(200),
  UNIQUE(nu_cid10)
);

CREATE TABLE IF NOT EXISTS dim_ciap2 (
  co_seq_dim_ciap2    BIGSERIAL PRIMARY KEY,
  nu_ciap2            VARCHAR(5) NOT NULL,
  no_ciap2            VARCHAR(200),
  UNIQUE(nu_ciap2)
);

-- FATOS

CREATE TABLE IF NOT EXISTS fat_cad_individual (
  co_seq_fat_cad_ind  BIGSERIAL PRIMARY KEY,
  co_dim_equipe       BIGINT REFERENCES dim_equipe(co_seq_dim_equipe),
  co_dim_tempo        BIGINT REFERENCES dim_tempo(co_seq_dim_tempo),
  co_cidadao          BIGINT NOT NULL,
  dt_nascimento       DATE,
  st_feminino         BOOLEAN,
  nu_cpf              VARCHAR(11),
  nu_cns              VARCHAR(15),
  st_bolsa_familia    BOOLEAN DEFAULT false,
  st_bpc              BOOLEAN DEFAULT false,
  st_ativo            BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS fat_cad_domiciliar (
  co_seq_fat_cad_dom      BIGSERIAL PRIMARY KEY,
  co_dim_equipe           BIGINT REFERENCES dim_equipe(co_seq_dim_equipe),
  co_dim_tempo            BIGINT REFERENCES dim_tempo(co_seq_dim_tempo),
  co_cidadao_responsavel  BIGINT,
  tp_situacao_moradia     INTEGER
);

CREATE TABLE IF NOT EXISTS fat_atendimento_individual (
  co_seq_fat_atd_ind          BIGSERIAL PRIMARY KEY,
  co_dim_equipe               BIGINT REFERENCES dim_equipe(co_seq_dim_equipe),
  co_dim_unidade_saude        BIGINT REFERENCES dim_unidade_saude(co_seq_dim_uns),
  co_dim_cbo                  BIGINT REFERENCES dim_cbo(co_seq_dim_cbo),
  co_dim_tempo                BIGINT REFERENCES dim_tempo(co_seq_dim_tempo),
  co_cidadao                  BIGINT NOT NULL,
  co_dim_tipo_atendimento     INTEGER, -- 1=programado,2=espontâneo,3=escuta,4=consulta_dia,5=urgência
  co_dim_cid10_avaliado       BIGINT REFERENCES dim_cid10(co_seq_dim_cid10),
  co_dim_ciap2_avaliado       BIGINT REFERENCES dim_ciap2(co_seq_dim_ciap2),
  nu_peso                     DECIMAL(5,2),
  nu_altura                   DECIMAL(5,2),
  st_encaminhamento           BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS fat_atendimento_odontologico (
  co_seq_fat_atd_odnt     BIGSERIAL PRIMARY KEY,
  co_dim_equipe           BIGINT REFERENCES dim_equipe(co_seq_dim_equipe),
  co_dim_tempo            BIGINT REFERENCES dim_tempo(co_seq_dim_tempo),
  co_cidadao              BIGINT NOT NULL,
  st_conclusao_tratamento BOOLEAN DEFAULT false,
  st_primeira_consulta    BOOLEAN DEFAULT false,
  nu_extracao_dente       INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fat_visita_domiciliar (
  co_seq_fat_vst_dom    BIGSERIAL PRIMARY KEY,
  co_dim_equipe         BIGINT REFERENCES dim_equipe(co_seq_dim_equipe),
  co_dim_tempo          BIGINT REFERENCES dim_tempo(co_seq_dim_tempo),
  co_dim_cbo            BIGINT REFERENCES dim_cbo(co_seq_dim_cbo),
  co_cidadao            BIGINT NOT NULL,
  st_visita_realizada   BOOLEAN DEFAULT true,
  co_dim_motivo_visita  INTEGER
);

CREATE TABLE IF NOT EXISTS fat_ativ_coletiva (
  co_seq_fat_atv_col    BIGSERIAL PRIMARY KEY,
  co_dim_equipe         BIGINT REFERENCES dim_equipe(co_seq_dim_equipe),
  co_dim_tempo          BIGINT REFERENCES dim_tempo(co_seq_dim_tempo),
  co_dim_tipo_atividade INTEGER,
  nu_participantes      INTEGER DEFAULT 0,
  st_pse                BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS fat_procedimento_individual (
  co_seq_fat_proc_ind   BIGSERIAL PRIMARY KEY,
  co_dim_equipe         BIGINT REFERENCES dim_equipe(co_seq_dim_equipe),
  co_dim_tempo          BIGINT REFERENCES dim_tempo(co_seq_dim_tempo),
  co_cidadao            BIGINT NOT NULL,
  nu_sigtap             VARCHAR(10),   -- código do procedimento/vacina
  nu_quantidade         INTEGER DEFAULT 1
);

-- VISUALIZAÇÕES (equivalentes às vw_* do PEC real)

CREATE OR REPLACE VIEW vw_acompanhamento_pre_natal AS
SELECT
  de.nu_ine,
  de.no_equipe,
  fai.co_cidadao,
  COUNT(DISTINCT fai.co_seq_fat_atd_ind) AS nu_consultas_pn,
  MAX(dt.dt_registro) AS dt_ultimo_atendimento,
  CASE WHEN COUNT(DISTINCT fai.co_seq_fat_atd_ind) >= 6 THEN true ELSE false END AS st_pn_adequado
FROM fat_atendimento_individual fai
JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_tempo dt ON fai.co_dim_tempo = dt.co_seq_dim_tempo
JOIN dim_ciap2 dc ON fai.co_dim_ciap2_avaliado = dc.co_seq_dim_ciap2
WHERE dc.nu_ciap2 IN ('W78','W79','W84')
GROUP BY de.nu_ine, de.no_equipe, fai.co_cidadao;

CREATE OR REPLACE VIEW vw_acompanhamento_hipertensao AS
SELECT
  de.nu_ine,
  de.no_equipe,
  fai.co_cidadao,
  COUNT(DISTINCT fai.co_seq_fat_atd_ind) AS nu_consultas_ultimo_ano,
  MAX(dt.dt_registro) AS dt_ultimo_atendimento,
  CASE WHEN COUNT(DISTINCT fai.co_seq_fat_atd_ind) >= 2 THEN true ELSE false END AS st_acompanhado
FROM fat_atendimento_individual fai
JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_tempo dt ON fai.co_dim_tempo = dt.co_seq_dim_tempo
LEFT JOIN dim_ciap2 dc ON fai.co_dim_ciap2_avaliado = dc.co_seq_dim_ciap2
LEFT JOIN dim_cid10 di ON fai.co_dim_cid10_avaliado = di.co_seq_dim_cid10
WHERE (dc.nu_ciap2 IN ('K86','K87') OR di.nu_cid10 LIKE 'I1%')
GROUP BY de.nu_ine, de.no_equipe, fai.co_cidadao;

CREATE OR REPLACE VIEW vw_acompanhamento_diabetes AS
SELECT
  de.nu_ine,
  de.no_equipe,
  fai.co_cidadao,
  COUNT(DISTINCT fai.co_seq_fat_atd_ind) AS nu_consultas_ultimo_ano,
  MAX(dt.dt_registro) AS dt_ultimo_atendimento,
  CASE WHEN COUNT(DISTINCT fai.co_seq_fat_atd_ind) >= 2 THEN true ELSE false END AS st_acompanhado
FROM fat_atendimento_individual fai
JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_tempo dt ON fai.co_dim_tempo = dt.co_seq_dim_tempo
LEFT JOIN dim_ciap2 dc ON fai.co_dim_ciap2_avaliado = dc.co_seq_dim_ciap2
LEFT JOIN dim_cid10 di ON fai.co_dim_cid10_avaliado = di.co_seq_dim_cid10
WHERE (dc.nu_ciap2 = 'T90' OR di.nu_cid10 LIKE 'E1%')
GROUP BY de.nu_ine, de.no_equipe, fai.co_cidadao;

CREATE OR REPLACE VIEW vw_cobertura_cadastral AS
SELECT
  de.nu_ine,
  de.no_equipe,
  de.nu_cnes,
  COUNT(DISTINCT fci.co_cidadao) AS nu_cadastros_individuais,
  COUNT(DISTINCT fcd.co_cidadao_responsavel) AS nu_cadastros_domiciliares,
  COUNT(DISTINCT CASE
    WHEN fci.dt_nascimento > CURRENT_DATE - INTERVAL '5 years' THEN fci.co_cidadao
  END) AS nu_criancas_0_5,
  COUNT(DISTINCT CASE
    WHEN fci.dt_nascimento < CURRENT_DATE - INTERVAL '60 years' THEN fci.co_cidadao
  END) AS nu_idosos_60_mais,
  COUNT(DISTINCT CASE WHEN fci.st_bolsa_familia THEN fci.co_cidadao END) AS nu_bolsa_familia,
  COUNT(DISTINCT CASE WHEN fci.st_bpc THEN fci.co_cidadao END) AS nu_bpc
FROM fat_cad_individual fci
JOIN dim_equipe de ON fci.co_dim_equipe = de.co_seq_dim_equipe
LEFT JOIN fat_cad_domiciliar fcd ON fci.co_cidadao = fcd.co_cidadao_responsavel
WHERE fci.st_ativo = true
GROUP BY de.nu_ine, de.no_equipe, de.nu_cnes;

-- ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_fat_atd_equipe ON fat_atendimento_individual(co_dim_equipe);
CREATE INDEX IF NOT EXISTS idx_fat_atd_tempo ON fat_atendimento_individual(co_dim_tempo);
CREATE INDEX IF NOT EXISTS idx_fat_atd_cidadao ON fat_atendimento_individual(co_cidadao);
CREATE INDEX IF NOT EXISTS idx_fat_vis_equipe ON fat_visita_domiciliar(co_dim_equipe);
CREATE INDEX IF NOT EXISTS idx_fat_cad_equipe ON fat_cad_individual(co_dim_equipe);
