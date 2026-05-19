# agents/05-docker-dev-agent.md

## Nome
`docker-dev-agent`

## Papel
Responsável por criar o ambiente de desenvolvimento completo usando Docker. O objetivo é que o desenvolvedor rode **um único comando** e tenha o banco PostgreSQL com dados fictícios prontos para testar todos os 15 indicadores — sem instalar nada além do Docker Desktop.

## Resultado Esperado

```bash
# O desenvolvedor só precisa rodar:
docker compose up -d

# E terá disponível:
# PostgreSQL com schema DW do eSUS PEC: localhost:5432
# Banco: esus_dev | Usuário: monitor_aps | Senha: monitor123
# PgAdmin (opcional): localhost:5050
```

---

## Tarefas

### TAREFA 1: Criar docker-compose.yml

Arquivo: `modules/monitor-aps/docker/docker-compose.yml`

```yaml
version: '3.9'

services:
  esus-db-dev:
    image: postgres:15-alpine
    container_name: esus_pec_dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: esus
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - esus_dev_data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d   # scripts executados na criação
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d esus"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: esus_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@sms.local
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    depends_on:
      esus-db-dev:
        condition: service_healthy
    profiles:
      - tools   # só sobe com: docker compose --profile tools up

volumes:
  esus_dev_data:
```

### TAREFA 2: Script de inicialização — Schema DW

Arquivo: `modules/monitor-aps/docker/init/01-schema-dw.sql`

Criar as tabelas do Data Warehouse do eSUS PEC conforme documentação oficial:
https://integracao.esusaps.bridge.ufsc.tech/dw/

```sql
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
WHERE dc.nu_ciap2 IN ('W78','W79','W84')  -- CIAP2 gestação
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
```

### TAREFA 3: Script de seed — Dados fictícios

Arquivo: `modules/monitor-aps/docker/init/02-seed-data.sql`

Criar dados realistas para o município de Ilicínea/MG com:
- 2 equipes eSF ativas
- 1 equipe eSB
- ~300 cidadãos cadastrados
- Atendimentos no quadrimestre 2 de 2025 (mai-ago)
- Indicadores propositalmente em diferentes classificações (alguns bons, alguns ruins) para testar os dashboards

```sql
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
CREATE ROLE IF NOT EXISTS monitor_aps_reader;
GRANT CONNECT ON DATABASE esus TO monitor_aps_reader;
GRANT USAGE ON SCHEMA public TO monitor_aps_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitor_aps_reader;
CREATE USER IF NOT EXISTS monitor_aps WITH PASSWORD 'monitor123';
GRANT monitor_aps_reader TO monitor_aps;

-- ================================================================
-- CIDADÃOS: 300 cadastros distribuídos entre as 2 equipes eSF
-- ================================================================
-- (gerado via plpgsql para não repetir 300 INSERTs)
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
    -- Distribuição etária realista
    v_nasc := CASE
      WHEN i % 10 = 0 THEN CURRENT_DATE - (INTERVAL '1 year' * (i % 24))  -- crianças 0-2 anos
      WHEN i % 8 = 0  THEN CURRENT_DATE - (INTERVAL '1 year' * (3 + i % 57)) -- crianças 3-5
      WHEN i % 6 = 0  THEN CURRENT_DATE - (INTERVAL '1 year' * (60 + i % 30)) -- idosos
      ELSE CURRENT_DATE - (INTERVAL '1 year' * (18 + i % 42)) -- adultos
    END;
    INSERT INTO fat_cad_individual (
      co_dim_equipe, co_dim_tempo, co_cidadao,
      dt_nascimento, st_feminino, st_bolsa_familia, st_bpc, st_ativo
    ) VALUES (
      v_equipe, v_tempo, 1000 + i,
      v_nasc,
      (i % 2 = 0),
      (i % 7 = 0),   -- ~14% Bolsa Família
      (i % 20 = 0),  -- ~5% BPC
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
  v_gest_c  BIGINT := (SELECT co_seq_dim_ciap2 FROM dim_ciap2 WHERE nu_ciap2 = 'W78');
  v_dt      BIGINT;
  i         INTEGER;
BEGIN
  -- EQUIPE 1 (ESF CENTRO): poucos atendimentos = indicadores ruins
  FOR i IN 1001..1050 LOOP  -- apenas 50 cidadãos atendidos dos 150
    SELECT co_seq_dim_tempo INTO v_dt FROM dim_tempo
      WHERE nu_ano = 2025 AND nu_mes = 5 + (i % 4)
      ORDER BY RANDOM() LIMIT 1;
    INSERT INTO fat_atendimento_individual
      (co_dim_equipe, co_dim_unidade_saude, co_dim_cbo, co_dim_tempo, co_cidadao, co_dim_tipo_atendimento, co_dim_ciap2_avaliado)
    VALUES (v_eq1, v_uns, v_med, v_dt, i, 1 + (i % 5),
      CASE WHEN i % 5 = 0 THEN v_has_c WHEN i % 7 = 0 THEN v_dm_c ELSE NULL END);
  END LOOP;

  -- EQUIPE 2 (ESF VILA NOVA): muitos atendimentos = indicadores bons
  FOR i IN 1151..1300 LOOP  -- 150 cidadãos, maioria atendida 2-3x
    SELECT co_seq_dim_tempo INTO v_dt FROM dim_tempo
      WHERE nu_ano = 2025 AND nu_mes = 5 + (i % 4)
      ORDER BY RANDOM() LIMIT 1;
    INSERT INTO fat_atendimento_individual
      (co_dim_equipe, co_dim_unidade_saude, co_dim_cbo, co_dim_tempo, co_cidadao, co_dim_tipo_atendimento, co_dim_ciap2_avaliado)
    VALUES (v_eq2, v_uns, CASE WHEN i % 3 = 0 THEN v_enf ELSE v_med END,
      v_dt, i, 1 + (i % 5),
      CASE WHEN i % 4 = 0 THEN v_has_c WHEN i % 6 = 0 THEN v_dm_c ELSE NULL END);
    -- Segunda consulta para muitos pacientes
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
      (i % 3 = 0),   -- ~33% primeiras consultas
      (i % 5 = 0));  -- ~20% conclusões
  END LOOP;
END $$;

-- Refresh das views (garantir que estão populadas)
ANALYZE fat_atendimento_individual;
ANALYZE fat_cad_individual;
ANALYZE fat_visita_domiciliar;
```

### TAREFA 4: Arquivo .env para desenvolvimento

Arquivo: `modules/monitor-aps/.env.development`

```bash
# Ambiente de desenvolvimento com Docker
NODE_ENV=development

# Banco de dados: Docker local
ESUS_PEC_DB_HOST=localhost
ESUS_PEC_DB_PORT=5432
ESUS_PEC_DB_NAME=esus
ESUS_PEC_DB_USER=monitor_aps
ESUS_PEC_DB_PASSWORD=monitor123
ESUS_PEC_DB_SSL=false

# Município de desenvolvimento
MONITOR_APS_MUNICIPIO_IBGE=3131703
MONITOR_APS_MUNICIPIO_NOME=Ilicínea
MONITOR_APS_ESTRATO_IED=4

# Cache desabilitado em dev (ver dados em tempo real)
MONITOR_APS_CACHE_TTL_SECONDS=0

# Porta do servidor backend do módulo
MONITOR_APS_API_PORT=3001
```

Arquivo: `modules/monitor-aps/.env.production`

```bash
# Ambiente de produção (SMS Ilicínea)
NODE_ENV=production

# PREENCHER com dados reais do servidor da SMS:
ESUS_PEC_DB_HOST=
ESUS_PEC_DB_PORT=5432
ESUS_PEC_DB_NAME=esus
ESUS_PEC_DB_USER=monitor_aps
ESUS_PEC_DB_PASSWORD=
ESUS_PEC_DB_SSL=false

MONITOR_APS_MUNICIPIO_IBGE=3131703
MONITOR_APS_MUNICIPIO_NOME=Ilicínea
MONITOR_APS_ESTRATO_IED=4
MONITOR_APS_CACHE_TTL_SECONDS=300
```

### TAREFA 5: Makefile / Scripts de conveniência

Arquivo: `modules/monitor-aps/Makefile`

```makefile
.PHONY: dev dev-tools stop reset logs psql help

## Sobe o banco PostgreSQL em Docker (desenvolvimento)
dev:
	docker compose -f docker/docker-compose.yml up -d
	@echo "✅ Banco disponível em localhost:5432"
	@echo "   Banco: esus | Usuário: monitor_aps | Senha: monitor123"

## Sobe também o PgAdmin (interface visual do banco)
dev-tools:
	docker compose -f docker/docker-compose.yml --profile tools up -d
	@echo "✅ PgAdmin disponível em http://localhost:5050"
	@echo "   Email: admin@sms.local | Senha: admin123"

## Para o banco
stop:
	docker compose -f docker/docker-compose.yml down

## Apaga o banco e recria do zero (útil quando mudar o seed)
reset:
	docker compose -f docker/docker-compose.yml down -v
	docker compose -f docker/docker-compose.yml up -d
	@echo "🔄 Banco recriado com dados de seed"

## Ver logs do banco
logs:
	docker compose -f docker/docker-compose.yml logs -f esus-db-dev

## Abre o psql direto no container
psql:
	docker exec -it esus_pec_dev psql -U postgres -d esus

## Ajuda
help:
	@grep -E '^##' Makefile | sed 's/## //'
```

### TAREFA 6: README de desenvolvimento

Arquivo: `modules/monitor-aps/README-DEV.md`

```markdown
# Como Iniciar o Ambiente de Desenvolvimento

## Pré-requisitos
- Docker Desktop instalado e rodando
- Node.js 18+ (ou a versão do sistema existente)

## Passo a passo

### 1. Subir o banco de desenvolvimento
\`\`\`bash
cd modules/monitor-aps
make dev
# ou sem make:
docker compose -f docker/docker-compose.yml up -d
\`\`\`

### 2. Verificar se o banco está pronto
\`\`\`bash
make psql
# deve abrir o psql. Testar:
# SELECT COUNT(*) FROM fat_cad_individual;  → deve retornar ~300
# \q para sair
\`\`\`

### 3. Iniciar o backend do módulo
\`\`\`bash
cd backend
cp ../.env.development .env
npm install
npm run dev
\`\`\`

### 4. (Opcional) Ver o banco visualmente
\`\`\`bash
make dev-tools
# Abre PgAdmin em http://localhost:5050
\`\`\`

## Resetar os dados de teste
\`\`\`bash
make reset
\`\`\`

## Dados disponíveis para teste

| Equipe         | INE        | Situação dos indicadores |
|----------------|------------|--------------------------|
| ESF CENTRO     | 0000000001 | Ruim (poucos atendimentos → testa alertas) |
| ESF VILA NOVA  | 0000000002 | Bom (atendimentos adequados → testa verde) |
| ESB CENTRO     | 0000000003 | Médio (teste eSB) |

Período de dados: Janeiro–Agosto 2025 (foco no 2° quadrimestre)
```

## Critérios de Aceitação

- [ ] `docker compose up -d` sobe o banco sem erros
- [ ] Script de schema cria todas as tabelas e views corretamente
- [ ] Script de seed popula ~300 cidadãos e atendimentos
- [ ] Usuário `monitor_aps` consegue conectar e fazer SELECT
- [ ] Usuário `monitor_aps` NÃO consegue fazer INSERT/UPDATE/DELETE
- [ ] `make reset` recria o banco do zero em < 30 segundos
- [ ] `.env.development` configurado e apontando para o Docker
- [ ] `.env.production` criado como template (sem senhas)
