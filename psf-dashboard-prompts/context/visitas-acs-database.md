# context/visitas-acs-database.md — Schema eSUS PEC para Visitas ACS/TACS

## Aviso Importante

O banco de produção eSUS PEC (187.108.119.178:5433) usa tabelas operacionais com prefixo `tb_`.
As tabelas DW sem prefixo (`fat_*`, `dim_*`) **não estão disponíveis** (módulo DW não habilitado).

**Antes de qualquer implementação, executar no banco de produção:**
```sql
-- 1. Descobrir o nome exato da tabela de visitas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name ILIKE '%visita%'
ORDER BY table_name;

-- 2. Listar colunas da tabela (usar o nome encontrado acima)
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'tb_fat_visita_domiciliar'
ORDER BY ordinal_position;

-- 3. Verificar colunas de geolocalização
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tb_fat_visita_domiciliar'
AND (column_name ILIKE '%lat%' OR column_name ILIKE '%lon%' OR column_name ILIKE '%geo%' OR column_name ILIKE '%coord%');

-- 4. Amostra de dados reais
SELECT * FROM tb_fat_visita_domiciliar LIMIT 3;

-- 5. Confirmar tabela de equipes
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name ILIKE '%dim_equipe%' OR table_name ILIKE '%equipe%'
ORDER BY table_name, ordinal_position;

-- 6. Confirmar profissionais
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name ILIKE '%profissional%'
ORDER BY table_name, ordinal_position
LIMIT 30;
```

---

## Tabelas Previstas (confirmar nomes em produção)

### `tb_fat_visita_domiciliar` — Visitas Domiciliares
Tabela principal com os registros de visita dos ACS/TACS.

| Coluna (prevista) | Tipo | Descrição |
|---|---|---|
| `co_seq_fat_visita_domiciliar` | bigint | PK |
| `co_dim_equipe` | bigint | FK para equipe |
| `co_dim_tempo` | bigint | FK para dimensão tempo |
| `no_profissional` | varchar | Nome do agente (pode estar aqui diretamente) |
| `nu_cbo` | varchar | CBO do profissional (515105=ACS, 322255=TACS) |
| `dt_realizado` | date/timestamp | Data/hora da visita |
| `co_dim_desfecho_visita` | int | Desfecho (1=Realizada, 2=Não encontrado, 3=Recusou, outros) |
| `co_dim_motivo_visita` | int | Motivo da visita |
| `st_tipo_instrumento_registro` | int/varchar | Instrumento de registro (CDS, PEC, App e-SUS) |
| `nu_latitude` | numeric | Geolocalização — latitude |
| `nu_longitude` | numeric | Geolocalização — longitude |
| `ds_anotacao` | text | Relato/anotação da visita |
| `co_fat_cidadao_pec` | bigint | FK para cidadão |
| `st_ficha_inativa` | boolean | 0=ativa, 1=inativa |

> ⚠️ Nomes reais podem diferir — validar via `information_schema.columns` antes de escrever queries.

---

### `tb_dim_equipe` (ou equivalente) — Equipes de Saúde

| Coluna (prevista) | Tipo | Descrição |
|---|---|---|
| `co_dim_equipe` | bigint | PK |
| `nu_ine` | varchar | Código INE da equipe |
| `no_equipe` | varchar | Nome da equipe |
| `tp_equipe` | int | Tipo (70=eSF, 71=eAP, 72=eSB, 80=eMulti) |
| `st_registro_valido` | int | 1=válido |

---

### `tb_dim_tempo` (ou equivalente) — Dimensão Tempo

| Coluna (prevista) | Tipo | Descrição |
|---|---|---|
| `co_dim_tempo` | bigint | PK |
| `nu_ano` | int | Ano (2025, 2026…) |
| `nu_mes` | int | Mês (1-12) |
| `dt_registro` | date | Data completa |

---

### `tb_fat_cad_individual` — Cadastro Individual do Cidadão
Usada opcionalmente para obter nome do cidadão visitado.

| Coluna (prevista) | Tipo | Descrição |
|---|---|---|
| `co_fat_cidadao_pec` | bigint | PK |
| `no_cidadao` | varchar | Nome do cidadão |
| `dt_nascimento` | date | Data de nascimento |
| `nu_cns` | varchar | CNS |
| `nu_cpf` | varchar | CPF |

---

## CBOs dos Agentes Comunitários

| CBO | Ocupação |
|---|---|
| 515105 | Agente Comunitário de Saúde (ACS) |
| 322255 | Agente de Combate a Endemias / TACS |
| 516220 | ACS (código alternativo — verificar qual está em uso) |

**Filtro no módulo**: trazer apenas registros onde `nu_cbo IN ('515105', '322255', '516220')`.

---

## Desfechos de Visita (co_dim_desfecho_visita)

Mapear para cores no mapa. Valores exatos verificar em produção:

```sql
SELECT DISTINCT co_dim_desfecho_visita, COUNT(*) as total
FROM tb_fat_visita_domiciliar
GROUP BY co_dim_desfecho_visita
ORDER BY total DESC;
```

Desfechos esperados no eSUS PEC:
- 1 → Visita realizada com sucesso (verde no mapa)
- 2 → Morador não encontrado (amarelo)
- 3 → Morador se recusou / não permitiu (vermelho)
- Outros → cinza

---

## Instrumentos de Registro (st_tipo_instrumento_registro)

```sql
SELECT DISTINCT st_tipo_instrumento_registro, COUNT(*) as total
FROM tb_fat_visita_domiciliar
GROUP BY st_tipo_instrumento_registro;
```

Valores esperados:
- 1 → CDS (Coleta de Dados Simplificada)
- 3 → PEC (Prontuário Eletrônico do Cidadão)
- 4 → Aplicativo e-SUS APS

---

## Queries de Referência (adaptar após validação)

### Lista paginada de visitas (base)
```sql
SELECT
    v.co_seq_fat_visita_domiciliar AS id,
    v.no_profissional               AS agent_name,
    v.nu_cbo                        AS cbo,
    e.nu_ine                        AS team_ine,
    e.no_equipe                     AS team_name,
    v.dt_realizado                  AS visited_at,
    v.st_tipo_instrumento_registro  AS registration_instrument,
    v.co_dim_desfecho_visita        AS outcome_code,
    v.co_dim_motivo_visita          AS motive_code,
    CASE WHEN v.nu_latitude IS NOT NULL AND v.nu_longitude IS NOT NULL
         THEN true ELSE false END   AS has_geolocation
FROM tb_fat_visita_domiciliar v
JOIN tb_dim_equipe e ON e.co_dim_equipe = v.co_dim_equipe
JOIN tb_dim_tempo  t ON t.co_dim_tempo  = v.co_dim_tempo
WHERE
    t.nu_ano  = :ano
    AND t.nu_mes = :mes
    AND v.nu_cbo IN ('515105', '322255', '516220')
    AND (v.st_ficha_inativa IS NULL OR v.st_ficha_inativa = 0)
ORDER BY v.dt_realizado DESC
LIMIT :per_page OFFSET :offset;
```

### Visitas com geolocalização (mapa)
```sql
SELECT
    v.co_seq_fat_visita_domiciliar AS id,
    v.nu_latitude::float            AS lat,
    v.nu_longitude::float           AS lng,
    v.no_profissional               AS agent_name,
    e.nu_ine                        AS team_ine,
    e.no_equipe                     AS team_name,
    v.dt_realizado                  AS visited_at,
    v.co_dim_desfecho_visita        AS outcome_code
FROM tb_fat_visita_domiciliar v
JOIN tb_dim_equipe e ON e.co_dim_equipe = v.co_dim_equipe
JOIN tb_dim_tempo  t ON t.co_dim_tempo  = v.co_dim_tempo
WHERE
    t.nu_ano  = :ano
    AND t.nu_mes = :mes
    AND v.nu_cbo IN ('515105', '322255', '516220')
    AND v.nu_latitude IS NOT NULL
    AND v.nu_longitude IS NOT NULL
    AND (v.st_ficha_inativa IS NULL OR v.st_ficha_inativa = 0)
ORDER BY v.dt_realizado DESC;
```

### Agentes por equipe
```sql
SELECT DISTINCT
    v.no_profissional AS agent_name,
    v.nu_cbo          AS cbo
FROM tb_fat_visita_domiciliar v
JOIN tb_dim_equipe e ON e.co_dim_equipe = v.co_dim_equipe
WHERE
    e.nu_ine = :ine
    AND v.nu_cbo IN ('515105', '322255', '516220')
ORDER BY v.no_profissional;
```

---

## Coordenadas do Município

**Ilicínea/MG** — centralizar o mapa:
- Latitude: -20.9417
- Longitude: -45.8306
- Zoom inicial Leaflet: 13

O IBGE do município pode ser lido via `apsConfig()` (campo `municipio_ibge` = 3131703).
