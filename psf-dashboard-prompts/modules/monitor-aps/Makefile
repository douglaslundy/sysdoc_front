.PHONY: dev dev-tools stop reset logs psql help

## Sobe o banco PostgreSQL em Docker (desenvolvimento)
dev:
	docker compose -f docker/docker-compose.yml up -d
	@echo "Banco disponível em localhost:5432"
	@echo "   Banco: esus | Usuário: monitor_aps | Senha: monitor123"

## Sobe também o PgAdmin (interface visual do banco)
dev-tools:
	docker compose -f docker/docker-compose.yml --profile tools up -d
	@echo "PgAdmin disponível em http://localhost:5050"
	@echo "   Email: admin@sms.local | Senha: admin123"

## Para o banco
stop:
	docker compose -f docker/docker-compose.yml down

## Apaga o banco e recria do zero (útil quando mudar o seed)
reset:
	docker compose -f docker/docker-compose.yml down -v
	docker compose -f docker/docker-compose.yml up -d
	@echo "Banco recriado com dados de seed"

## Ver logs do banco
logs:
	docker compose -f docker/docker-compose.yml logs -f esus-db-dev

## Abre o psql direto no container
psql:
	docker exec -it esus_pec_dev psql -U postgres -d esus

## Ajuda
help:
	@grep -E '^##' Makefile | sed 's/## //'
