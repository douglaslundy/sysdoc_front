/**
 * Script de teste isolado — Task 1.2
 * Uso: node scripts/test-connection.js
 * Conecta ao banco e lista as equipes da dim_equipe.
 */

require('dotenv').config({
  path: require('path').join(__dirname, '../../.env.development'),
});

const { testConnection, loadConfig, getPool } = require('../src/config/database');

async function main() {
  const config = loadConfig();
  if (!config) {
    console.error('ERRO: nenhuma configuração encontrada (env vars ou data/db-config.json).');
    process.exit(1);
  }

  console.log(`\nTestando conexão com ${config.host}:${config.port}/${config.database}...`);

  // 1. Teste de conexão
  const result = await testConnection(config);
  console.log('✅ Conexão OK');
  console.log('   Banco   :', result.database);
  console.log('   Versão  :', result.version.split(',')[0]);

  // 2. Listar equipes
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT nu_ine, no_equipe,
           CASE tp_equipe
             WHEN 70 THEN 'eSF'
             WHEN 71 THEN 'eAP'
             WHEN 72 THEN 'eSB'
             WHEN 80 THEN 'eMulti'
             ELSE tp_equipe::text
           END AS tipo,
           nu_cnes,
           st_ativo
    FROM dim_equipe
    ORDER BY tp_equipe, no_equipe;
  `);

  console.log(`\n📋 Equipes encontradas (${rows.length}):`);
  console.table(rows);

  await pool.end();
}

main().catch((err) => {
  console.error('ERRO:', err.message);
  process.exit(1);
});
