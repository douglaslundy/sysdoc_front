# Monitor APS

Dashboard de monitoramento de metas e indicadores do Componente de Qualidade e Vínculo e Acompanhamento Territorial do cofinanciamento federal da APS, conforme **Portaria GM/MS nº 3.493/2024** e **Portaria GM/MS nº 6.907/2025**.

---

## Pré-requisitos

- Node.js 18+
- Docker Desktop (para ambiente de desenvolvimento)
- PostgreSQL do eSUS PEC (produção)
- npm install recharts — executar em `sysdoc_front/` antes de usar o módulo

---

## Instalação

### 1. Backend

```bash
cd modules/monitor-aps/backend
npm install
cp ../.env.example ../.env.development
# editar ../.env.development com as credenciais corretas
npm run dev   # porta 3001
```

### 2. Banco de desenvolvimento (Docker)

```bash
cd modules/monitor-aps
docker compose -f docker/docker-compose.yml up -d
```

Credenciais do banco de dev:

| Parâmetro | Valor          |
|-----------|---------------|
| Host      | localhost     |
| Porta     | 5432          |
| Banco     | esus          |
| Usuário   | monitor_aps   |
| Senha     | monitor123    |

### 3. Frontend (integrado ao sysdoc_front)

```bash
cd sysdoc_front
npm install recharts   # adicionar dependência
npm run dev            # porta 3000 — inclui proxy para o backend Monitor APS
```

As rotas do módulo ficam acessíveis em:
- `/monitor-aps` — Dashboard
- `/monitor-aps/vinculo` — Vínculo Territorial
- `/monitor-aps/qualidade` — Indicadores de Qualidade
- `/monitor-aps/equipe` — Por Equipe
- `/monitor-aps/configuracoes` — Configurações (somente admin)

---

## Configuração para produção

1. Criar usuário somente-leitura no banco do eSUS PEC:

```bash
psql -U postgres -d esus -f docs/setup-readonly-user.sql
```

2. Configurar variáveis de ambiente (nunca expor no frontend):

```bash
cp .env.example .env.production
# preencher com credenciais reais do servidor PostgreSQL do eSUS PEC
```

3. Subir o backend do Monitor APS como serviço separado:

```bash
NODE_ENV=production npm start   # porta definida em MONITOR_APS_PORT
```

4. Atualizar `MONITOR_APS_BACKEND_URL` no `.env` do sysdoc_front apontando para o servidor do backend Monitor APS.

---

## Segurança

- O backend acessa o banco do eSUS PEC **exclusivamente em modo leitura** (usuário com permissão `SELECT` apenas).
- As credenciais do banco nunca são enviadas ao frontend — ficam apenas nas variáveis de ambiente do servidor backend.
- As rotas `/api/monitor-aps/*` são protegidas pelo sistema de autenticação do sysdoc via proxy Next.js.

---

## Os 15 Indicadores

Veja [`docs/INDICADORES.md`](docs/INDICADORES.md) para a documentação completa de cada indicador, incluindo fórmula, thresholds e fonte normativa.

| Bloco | IND | Nome |
|-------|-----|------|
| eSF/eAP | 1 | Mais Acesso à Atenção Primária |
| eSF/eAP | 2 | Cuidado Longitudinal da Criança |
| eSF/eAP | 3 | Cuidado da Gestante e Puérpera |
| eSF/eAP | 4 | Cuidado da Pessoa com Hipertensão |
| eSF/eAP | 5 | Cuidado da Pessoa com Diabetes |
| eSF/eAP | 6 | Cuidado da Pessoa Idosa |
| eSF/eAP | 7 | Saúde Mental na APS |
| eSF/eAP | 8 | Visita Domiciliar por ACS/TACS |
| eSF/eAP | 9 | Vacinação na APS |
| eSF/eAP | 10 | Ações Interprofissionais |
| eSB | 13 | Acesso à Saúde Bucal |
| eSB | 14 | Conclusão de Tratamento Odontológico |
| eSB | 15 | Ações Coletivas em Saúde Bucal |

---

## Referências Normativas

- [Portaria GM/MS nº 3.493/2024](https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt3493_11_04_2024.html)
- [Portaria GM/MS nº 6.907/2025](https://bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt6907_08_05_2025.html)
- [DW PEC — Documentação do Schema](https://integracao.esusaps.bridge.ufsc.tech/dw/index.html)
- [Fichas Técnicas dos Indicadores (MS)](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas)
