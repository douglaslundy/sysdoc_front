const { Router } = require('express');
const { testConnection, saveConfig, loadConfig, getPool } = require('../config/database');

const router = Router();

// GET /api/monitor-aps/config/status
router.get('/status', async (_req, res) => {
  const config = loadConfig();
  if (!config) return res.json({ configured: false, connected: false });
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    res.json({ configured: true, connected: true, host: config.host, database: config.database });
  } catch (err) {
    res.json({ configured: true, connected: false, error: err.message });
  }
});

// POST /api/monitor-aps/config/test
router.post('/test', async (req, res) => {
  const { host, port, database, user, password } = req.body;
  if (!host || !database || !user) {
    return res.status(400).json({ success: false, error: 'host, database e user são obrigatórios' });
  }
  try {
    const result = await testConnection({ host, port: port || 5432, database, user, password });
    res.json(result);
  } catch (err) {
    res.status(200).json({ success: false, error: err.message });
  }
});

// POST /api/monitor-aps/config/save
router.post('/save', (req, res) => {
  const { host, port, database, user, password } = req.body;
  if (!host || !database || !user) {
    return res.status(400).json({ success: false, error: 'host, database e user são obrigatórios' });
  }
  try {
    saveConfig({ host, port: port || 5432, database, user, password });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/monitor-aps/config/equipes
router.get('/equipes', async (_req, res) => {
  try {
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
             nu_cnes, st_ativo
      FROM dim_equipe
      ORDER BY tp_equipe, no_equipe
    `);
    res.json({ equipes: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
