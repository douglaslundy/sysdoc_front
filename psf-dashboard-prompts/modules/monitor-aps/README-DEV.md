# Como Iniciar o Ambiente de Desenvolvimento

## Pré-requisitos
- Docker Desktop instalado e rodando
- Node.js 18+ (ou a versão do sistema existente)

## Passo a passo

### 1. Subir o banco de desenvolvimento
```bash
cd modules/monitor-aps
make dev
# ou sem make:
docker compose -f docker/docker-compose.yml up -d
```

### 2. Verificar se o banco está pronto
```bash
make psql
# deve abrir o psql. Testar:
# SELECT COUNT(*) FROM fat_cad_individual;  → deve retornar ~300
# \q para sair
```

### 3. Iniciar o backend do módulo
```bash
cd backend
cp ../.env.development .env
npm install
npm run dev
```

### 4. (Opcional) Ver o banco visualmente
```bash
make dev-tools
# Abre PgAdmin em http://localhost:5050
```

## Resetar os dados de teste
```bash
make reset
```

## Dados disponíveis para teste

| Equipe         | INE        | Situação dos indicadores |
|----------------|------------|--------------------------|
| ESF CENTRO     | 0000000001 | Ruim (poucos atendimentos → testa alertas) |
| ESF VILA NOVA  | 0000000002 | Bom (atendimentos adequados → testa verde) |
| ESB CENTRO     | 0000000003 | Médio (teste eSB) |

Período de dados: Janeiro–Agosto 2025 (foco no 2° quadrimestre)
