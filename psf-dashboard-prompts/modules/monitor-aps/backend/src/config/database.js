const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../data/db-config.json');

function loadConfig() {
  // Env vars têm prioridade sobre o arquivo de config (permite override em produção)
  if (process.env.ESUS_PEC_DB_HOST) {
    return {
      host:     process.env.ESUS_PEC_DB_HOST,
      port:     parseInt(process.env.ESUS_PEC_DB_PORT || '5432', 10),
      database: process.env.ESUS_PEC_DB_NAME     || 'esus',
      user:     process.env.ESUS_PEC_DB_USER     || 'monitor_aps',
      password: process.env.ESUS_PEC_DB_PASSWORD || '',
    };
  }
  if (!fs.existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function saveConfig(config) {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({
    host:     config.host,
    port:     config.port,
    database: config.database,
    user:     config.user,
    password: config.password,
  }, null, 2));
  // Resetar o pool para forçar reconexão com a nova config
  if (pool) { pool.end().catch(() => {}); pool = null; }
}

let pool = null;

function getPool() {
  if (pool) return pool;
  const config = loadConfig();
  if (!config) throw new Error('Banco de dados não configurado. Acesse Configurações.');
  pool = new Pool({
    ...config,
    ssl: process.env.ESUS_PEC_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on('error', (err) => {
    console.error('[db] erro inesperado no pool:', err.message);
    pool = null; // próxima chamada recria o pool
  });
  return pool;
}

async function testConnection(config) {
  const testPool = new Pool({
    ...config,
    ssl: process.env.ESUS_PEC_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  try {
    const result = await testPool.query(
      'SELECT current_database() AS database, version() AS version'
    );
    return {
      success:  true,
      database: result.rows[0].database,
      version:  result.rows[0].version,
    };
  } finally {
    await testPool.end().catch(() => {});
  }
}

module.exports = { getPool, testConnection, saveConfig, loadConfig };
