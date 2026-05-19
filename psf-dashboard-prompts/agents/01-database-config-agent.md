# agents/01-database-config-agent.md

## Nome
`database-config-agent`

## Papel
Responsável por criar o módulo de **configuração e conexão** ao banco de dados PostgreSQL do eSUS PEC. Este é o alicerce de todo o sistema — sem ele, nenhum dado pode ser recuperado.

## Escopo

Este agente cria:
1. Página de configuração da conexão (frontend)
2. Serviço de conexão ao banco (backend)
3. Endpoint de teste de conexão
4. Armazenamento seguro das configurações
5. Script SQL de criação do usuário somente-leitura
6. Health check automático

## Tarefas

### TAREFA 1: Criar o serviço de conexão backend

Criar `modules/monitor-aps/backend/src/config/database.js` (ou `.py`):

```javascript
// Node.js / Express com pg (node-postgres)
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../data/db-config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function saveConfig(config) {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Nunca salvar senha em texto puro em produção — usar variáveis de ambiente
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    // Em produção: salvar apenas referência, senha via env var
    password: config.password 
  }, null, 2));
}

let pool = null;

function getPool() {
  if (!pool) {
    const config = loadConfig();
    if (!config) throw new Error('Banco de dados não configurado. Acesse Configurações.');
    pool = new Pool({
      ...config,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

async function testConnection(config) {
  const testPool = new Pool({ ...config, max: 1, connectionTimeoutMillis: 5000 });
  try {
    const result = await testPool.query('SELECT current_database(), version()');
    await testPool.end();
    return { 
      success: true, 
      database: result.rows[0].current_database,
      version: result.rows[0].version
    };
  } catch (err) {
    await testPool.end().catch(() => {});
    throw err;
  }
}

module.exports = { getPool, testConnection, saveConfig, loadConfig };
```

### TAREFA 2: Criar endpoint de configuração (REST API)

Arquivo: `modules/monitor-aps/backend/src/routes/config.routes.js`

Endpoints:
- `GET  /api/monitor-aps/config/status` — retorna se o banco está configurado e conectado
- `POST /api/monitor-aps/config/test`   — testa uma configuração sem salvar
- `POST /api/monitor-aps/config/save`   — salva a configuração (requer permissão admin)
- `GET  /api/monitor-aps/config/equipes` — lista equipes disponíveis no banco configurado

### TAREFA 3: Criar página de configuração (Frontend React)

Arquivo: `modules/monitor-aps/frontend/src/pages/Configuracoes.jsx`

A página deve ter:

**Seção 1: Conexão com o Banco**
- Campo: Host/IP do servidor PostgreSQL
- Campo: Porta (default: 5432)
- Campo: Nome do banco (default: esus)
- Campo: Usuário (default: monitor_aps)
- Campo: Senha (input type=password)
- Botão: "Testar Conexão" → mostra resultado (sucesso com versão PEC ou erro)
- Botão: "Salvar Configuração"
- Badge de status: 🟢 Conectado / 🔴 Desconectado / 🟡 Não configurado

**Seção 2: Configurações do Município**
- Campo: IBGE do município
- Campo: Nome do município
- Campo: Estrato IED (1 a 4) — seletor
- Lista de equipes ativas (carregada do banco após conexão): checkbox por INE/nome

**Seção 3: Período de Avaliação**
- Seletor: Ano
- Seletor: Quadrimestre (1° Quad: jan-abr / 2° Quad: mai-ago / 3° Quad: set-dez)

**Seção 4: Script SQL (informativo)**
- Caixa de texto somente leitura com o SQL para criar o usuário de leitura
- Botão "Copiar SQL"

### TAREFA 4: Criar script SQL de setup

Arquivo: `modules/monitor-aps/docs/setup-readonly-user.sql`

```sql
-- =================================================================
-- Monitor APS: Criação de usuário somente-leitura no banco eSUS PEC
-- Execute este script UMA VEZ como superusuário (postgres)
-- =================================================================

-- 1. Criar role de leitura
CREATE ROLE monitor_aps_reader;

-- 2. Permissões de conexão e schema
GRANT CONNECT ON DATABASE esus TO monitor_aps_reader;
GRANT USAGE ON SCHEMA public TO monitor_aps_reader;

-- 3. Permissão de SELECT em todas as tabelas atuais e futuras
GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO monitor_aps_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO monitor_aps_reader;

-- 4. Criar o usuário de aplicação
CREATE USER monitor_aps WITH PASSWORD 'SenhaSegura123!';
GRANT monitor_aps_reader TO monitor_aps;

-- 5. Verificação
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee = 'monitor_aps_reader' LIMIT 5;
```

## Critérios de Aceitação

- [ ] Conexão ao PostgreSQL do eSUS PEC com somente-leitura funciona
- [ ] Teste de conexão retorna a versão do PostgreSQL e banco conectado
- [ ] Configurações são persistidas entre reinicializações
- [ ] Listagem de equipes (dim_equipe) carrega corretamente
- [ ] Usuário admin do sistema existente pode acessar a página de config
- [ ] Usuários não-admin não conseguem alterar as configurações
- [ ] Erro de conexão é mostrado de forma amigável ao usuário

## Dependências

Backend (Node.js):
```json
{
  "pg": "^8.11.0",
  "pg-pool": "incluído no pg"
}
```

Backend (Python alternativo):
```txt
psycopg2-binary==2.9.9
asyncpg==0.29.0
```
