# tasks/task-0-docker-setup.md — Task 0: Ambiente Docker (executar PRIMEIRO)

## Quando executar
**Antes de qualquer outra task.** Este é o pré-requisito de todo o desenvolvimento.

## Instrução para o Claude Code

```
Leia o arquivo agents/05-docker-dev-agent.md completamente.
Execute todas as 6 tarefas na ordem.
Ao final, valide que o banco está funcionando rodando:

  docker exec -it esus_pec_dev psql -U postgres -d esus \
    -c "SELECT COUNT(*) as cidadaos FROM fat_cad_individual;"

O resultado deve ser ~300. Só então marque esta task como concluída.
```

## Checklist desta task

- [ ] `modules/monitor-aps/docker/docker-compose.yml` criado
- [ ] `modules/monitor-aps/docker/init/01-schema-dw.sql` criado
- [ ] `modules/monitor-aps/docker/init/02-seed-data.sql` criado
- [ ] `modules/monitor-aps/.env.development` criado
- [ ] `modules/monitor-aps/.env.production` criado (template)
- [ ] `modules/monitor-aps/Makefile` criado
- [ ] `modules/monitor-aps/README-DEV.md` criado
- [ ] `docker compose up -d` executa sem erros
- [ ] Banco tem ~300 registros em `fat_cad_individual`
- [ ] Usuário `monitor_aps` conecta com senha `monitor123`

## Estrutura de arquivos após esta task

```
modules/monitor-aps/
├── docker/
│   ├── docker-compose.yml
│   └── init/
│       ├── 01-schema-dw.sql   ← executado automaticamente na criação
│       └── 02-seed-data.sql   ← executado automaticamente após schema
├── .env.development            ← usar em dev (aponta para Docker)
├── .env.production             ← template para SMS Ilicínea
├── Makefile                    ← atalhos: make dev, make reset, make psql
└── README-DEV.md               ← instruções para o time
```

## Fluxo de trabalho com Docker

```
Desenvolvimento:          Produção (SMS Ilicínea):
┌─────────────────┐       ┌──────────────────────────┐
│  Docker local   │       │  Servidor da SMS         │
│  PostgreSQL     │  →→→  │  PostgreSQL do eSUS PEC  │
│  (dados fake)   │       │  (dados reais)           │
│  porta 5432     │       │  porta 5432              │
└─────────────────┘       └──────────────────────────┘
     ↕ .env.development        ↕ .env.production
     (automático)              (preencher antes de implantar)
```

A troca entre ambientes é feita apenas alterando qual `.env` o backend carrega.
Nenhuma linha de código muda entre dev e produção.
