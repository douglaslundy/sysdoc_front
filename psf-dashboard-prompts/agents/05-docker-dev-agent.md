# agents/05-docker-dev-agent.md

## Nome
`docker-dev-agent`

## Papel
Responsável por criar o ambiente de desenvolvimento com Docker: um PostgreSQL local com o schema DW do eSUS PEC e dados fictícios. Permite desenvolver e testar os cálculos dos indicadores sem acesso ao banco real da SMS.

## Resultado Esperado

```bash
# O desenvolvedor roda apenas:
cd psf-dashboard-prompts/modules/monitor-aps
docker compose -f docker/docker-compose.yml up -d

# E terá disponível:
# PostgreSQL: localhost:5432
# Banco: esus | Usuário: monitor_aps | Senha: monitor123

# Depois configura o sysdoc_back/.env:
APS_DB_HOST=localhost
APS_DB_PORT=5432
APS_DB_DATABASE=esus
APS_DB_USERNAME=monitor_aps
APS_DB_PASSWORD=monitor123
```

---

## Tarefas

### TAREFA 1: docker-compose.yml

Arquivo: `psf-dashboard-prompts/modules/monitor-aps/docker/docker-compose.yml`

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
      - ./init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d esus"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: esus_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@sms.local
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    depends_on:
      esus-db-dev:
        condition: service_healthy
    profiles:
      - tools  # só sobe com: docker compose --profile tools up

volumes:
  esus_dev_data:
```

### TAREFA 2: Schema DW

Arquivo: `psf-dashboard-prompts/modules/monitor-aps/docker/init/01-schema-dw.sql`

Criar as tabelas do DW conforme documentação oficial: https://integracao.esusaps.bridge.ufsc.tech/dw/

Tabelas necessárias:
- `dim_equipe` (nu_ine, no_equipe, tp_equipe: 70=eSF/71=eAP/72=eSB/80=eMulti, nu_cnes, st_ativo)
- `dim_unidade_saude` (nu_cnes, no_unidade_saude, co_municipio_ibge)
- `dim_tempo` (dt_registro, nu_dia, nu_mes, nu_ano, nu_quadrimestre, nu_competencia)
- `dim_cbo` (nu_cbo, no_cbo)
- `dim_cid10` (nu_cid10, no_cid10)
- `dim_ciap2` (nu_ciap2, no_ciap2)
- `fat_cad_individual` (co_dim_equipe, co_dim_tempo, co_cidadao, dt_nascimento, st_feminino, st_bolsa_familia, st_bpc, st_ativo)
- `fat_cad_domiciliar` (co_dim_equipe, co_dim_tempo, co_cidadao_responsavel)
- `fat_atendimento_individual` (co_dim_equipe, co_dim_cbo, co_dim_tempo, co_cidadao, co_dim_tipo_atendimento, co_dim_cid10_avaliado, co_dim_ciap2_avaliado, nu_peso, nu_altura)
- `fat_atendimento_odontologico` (co_dim_equipe, co_dim_tempo, co_cidadao, st_conclusao_tratamento, st_primeira_consulta)
- `fat_visita_domiciliar` (co_dim_equipe, co_dim_tempo, co_dim_cbo, co_cidadao, st_visita_realizada)
- `fat_ativ_coletiva` (co_dim_equipe, co_dim_tempo, nu_participantes)
- `fat_vacinacao` (co_dim_equipe, co_dim_tempo, co_cidadao, nu_sigtap_imuno, st_realizado)

Views equivalentes às do PEC real:
- `vw_acompanhamento_pre_natal` (nu_ine, co_cidadao, st_pn_adequado)
- `vw_acompanhamento_hipertensao` (nu_ine, co_cidadao, st_acompanhado)
- `vw_acompanhamento_diabetes` (nu_ine, co_cidadao, st_acompanhado)
- `vw_cobertura_cadastral` (nu_ine, nu_cadastros_individuais, nu_cadastros_domiciliares)

### TAREFA 3: Dados fictícios para Ilicínea/MG

Arquivo: `psf-dashboard-prompts/modules/monitor-aps/docker/init/02-seed-data.sql`

Criar:
- 1 unidade de saúde (CNES 2794454 — UBS Centro Ilicínea)
- 2 equipes eSF (INE 0000000001 e 0000000002) + 1 eSB (INE 0000000003)
- ~300 cidadãos distribuídos entre as equipes
- Atendimentos no 2° quadrimestre de 2025 (mai-ago)
- Equipe 1 com indicadores RUINS (testa alertas), Equipe 2 com indicadores BONS (testa verde)
- Usuário somente-leitura `monitor_aps` com senha `monitor123`

### TAREFA 4: Makefile

Arquivo: `psf-dashboard-prompts/modules/monitor-aps/Makefile`

```makefile
dev:
	docker compose -f docker/docker-compose.yml up -d
	@echo "Banco disponível em localhost:5432"
	@echo "Banco: esus | Usuário: monitor_aps | Senha: monitor123"

dev-tools:
	docker compose -f docker/docker-compose.yml --profile tools up -d

stop:
	docker compose -f docker/docker-compose.yml down

reset:
	docker compose -f docker/docker-compose.yml down -v
	docker compose -f docker/docker-compose.yml up -d

psql:
	docker exec -it esus_pec_dev psql -U postgres -d esus
```

---

## Como usar com o sysdoc_back

Após subir o Docker, configurar o `sysdoc_back/.env`:

```bash
APS_DB_HOST=localhost
APS_DB_PORT=5432
APS_DB_DATABASE=esus
APS_DB_USERNAME=monitor_aps
APS_DB_PASSWORD=monitor123
MONITOR_APS_MUNICIPIO_NOME=Ilicínea
MONITOR_APS_MUNICIPIO_IBGE=3131703
MONITOR_APS_ESTRATO_IED=4
```

Em produção, substituir com as credenciais reais do servidor da SMS — zero mudança de código.

---

## Dados disponíveis para teste

| Equipe       | INE        | Situação dos indicadores |
|---|---|---|
| ESF CENTRO   | 0000000001 | Ruim → testa alertas e classificação regular |
| ESF VILA NOVA| 0000000002 | Bom  → testa indicadores no verde |
| ESB CENTRO   | 0000000003 | Médio → testa bloco eSB |

Período: Janeiro–Agosto 2025 (foco no 2° quadrimestre)

---

## Critérios de Aceitação

- [ ] `docker compose up -d` sobe o banco sem erros
- [ ] Schema cria todas as tabelas e views corretamente
- [ ] Seed popula ~300 cidadãos e atendimentos
- [ ] Usuário `monitor_aps` consegue SELECT nas tabelas DW
- [ ] Usuário `monitor_aps` NÃO consegue INSERT/UPDATE/DELETE
- [ ] `make reset` recria o banco em < 30 segundos
- [ ] Laravel conecta ao banco via `APS_DB_*` no `.env` após `php artisan config:clear`
