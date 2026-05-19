const { Router } = require('express');
const { getPool } = require('../config/database');
const { calcularVinculo } = require('../services/vinculo.service');
const { calcularTodosIndicadoresESF,
        calcularIndicador1, calcularIndicador2, calcularIndicador3,
        calcularIndicador4, calcularIndicador5, calcularIndicador6,
        calcularIndicador7, calcularIndicador8, calcularIndicador9,
        calcularIndicador10 } = require('../services/qualidade-esf.service');
const { calcularTodosIndicadoresESB,
        calcularIndicador13, calcularIndicador14, calcularIndicador15 } = require('../services/qualidade-esb.service');
const { calcularRepasseEstimado, THRESHOLDS } = require('../services/classificacao.service');
const { withCache, clearCache } = require('../utils/cache');

const router = Router();

function p(req) {
  return {
    ano:          Number(req.query.ano  || 2025),
    quadrimestre: Number(req.query.quadrimestre || 2),
    ine:          req.query.ine   || null,
    bloco:        req.query.bloco || null,
  };
}

function err(res, e) {
  console.error('[monitor-aps]', e.message);
  res.status(500).json({ error: e.message });
}

// GET /api/monitor-aps/indicadores/resumo
router.get('/resumo', async (req, res) => {
  const { ano, quadrimestre } = p(req);
  try {
    const pool = getPool();
    const { rows: equipes } = await pool.query(
      `SELECT nu_ine, no_equipe, tp_equipe FROM dim_equipe WHERE st_ativo = true ORDER BY tp_equipe, no_equipe`
    );

    const esf = equipes.filter(e => [70, 71].includes(e.tp_equipe));
    const esb = equipes.filter(e => e.tp_equipe === 72);

    const [vinculos, qualidadeESF, qualidadeESB] = await Promise.all([
      withCache(`vinculo_${ano}_${quadrimestre}`, 300,
        () => calcularVinculo(ano, quadrimestre)),
      Promise.all(esf.map(e =>
        calcularTodosIndicadoresESF(e.nu_ine, ano, quadrimestre).catch(() => [])
      )),
      Promise.all(esb.map(e =>
        calcularTodosIndicadoresESB(e.nu_ine, ano, quadrimestre).catch(() => [])
      )),
    ]);

    const estrato = Number(process.env.MONITOR_APS_ESTRATO_IED || 4);
    const equipesComClass = vinculos.map(v => ({
      ine: v.ine, nome: v.nome, tipo: v.tipo,
      classificacao_vinculo:   v.classificacao,
      classificacao_qualidade: 'regular',
    }));
    const repasse = calcularRepasseEstimado(equipesComClass, estrato);

    res.json({
      municipio: process.env.MONITOR_APS_MUNICIPIO_NOME || '',
      ibge:      process.env.MONITOR_APS_MUNICIPIO_IBGE || '',
      periodo: { ano, quadrimestre },
      total_equipes: equipes.length,
      vinculos,
      repasse,
      qualidade: { esf: qualidadeESF.flat(), esb: qualidadeESB.flat() },
    });
  } catch (e) { err(res, e); }
});

// GET /api/monitor-aps/indicadores/vinculo
router.get('/vinculo', async (req, res) => {
  const { ano, quadrimestre, ine } = p(req);
  try {
    const data = await withCache(`vinculo_${ine}_${ano}_${quadrimestre}`, 300,
      () => calcularVinculo(ano, quadrimestre, ine));
    res.json({ periodo: { ano, quadrimestre }, equipes: data });
  } catch (e) { err(res, e); }
});

// GET /api/monitor-aps/indicadores/qualidade
router.get('/qualidade', async (req, res) => {
  const { ano, quadrimestre, ine, bloco } = p(req);
  try {
    const pool = getPool();
    const { rows: equipes } = await pool.query(
      `SELECT nu_ine, tp_equipe FROM dim_equipe WHERE st_ativo = true ${ine ? 'AND nu_ine = $1' : ''} ORDER BY tp_equipe`,
      ine ? [ine] : []
    );
    const resultados = await Promise.all(equipes.map(async e => {
      const isESF = [70, 71].includes(e.tp_equipe);
      const isESB = e.tp_equipe === 72;
      if (bloco === 'esb' && !isESB) return [];
      if (bloco === 'esf' && !isESF) return [];
      const fns = [];
      if (isESF) fns.push(calcularTodosIndicadoresESF(e.nu_ine, ano, quadrimestre));
      if (isESB) fns.push(calcularTodosIndicadoresESB(e.nu_ine, ano, quadrimestre));
      return (await Promise.all(fns)).flat();
    }));
    res.json({ periodo: { ano, quadrimestre }, indicadores: resultados.flat() });
  } catch (e) { err(res, e); }
});

// GET /api/monitor-aps/indicadores/qualidade/:id
router.get('/qualidade/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { ano, quadrimestre, ine } = p(req);
  if (!ine) return res.status(400).json({ error: 'Parâmetro ine é obrigatório' });

  const mapaESF = {
    1: calcularIndicador1,  2: calcularIndicador2,  3: calcularIndicador3,
    4: calcularIndicador4,  5: calcularIndicador5,  6: calcularIndicador6,
    7: calcularIndicador7,  8: calcularIndicador8,  9: calcularIndicador9,
    10: calcularIndicador10,
  };
  const mapaESB = { 13: calcularIndicador13, 14: calcularIndicador14, 15: calcularIndicador15 };
  const fn = mapaESF[id] || mapaESB[id];
  if (!fn) return res.status(404).json({ error: `Indicador ${id} não encontrado` });

  try {
    const data = await fn(ine, ano, quadrimestre);
    res.json(data);
  } catch (e) { err(res, e); }
});

// GET /api/monitor-aps/indicadores/repasse
router.get('/repasse', async (req, res) => {
  const { ano, quadrimestre } = p(req);
  const estrato = Number(process.env.MONITOR_APS_ESTRATO_IED || 4);
  try {
    const vinculos = await withCache(`vinculo_all_${ano}_${quadrimestre}`, 300,
      () => calcularVinculo(ano, quadrimestre));
    const equipesComClass = vinculos.map(v => ({
      ine: v.ine, nome: v.nome, tipo: v.tipo,
      classificacao_vinculo:   v.classificacao,
      classificacao_qualidade: 'regular',
    }));
    const repasse = calcularRepasseEstimado(equipesComClass, estrato);
    const total   = repasse.reduce((s, e) => s + e.total_estimado, 0);
    res.json({ periodo: { ano, quadrimestre }, estrato_ied: estrato, repasse, total_municipal: total });
  } catch (e) { err(res, e); }
});

// GET /api/monitor-aps/indicadores/equipes
router.get('/equipes', async (req, res) => {
  const { ano, quadrimestre } = p(req);
  try {
    const vinculos = await calcularVinculo(ano, quadrimestre);
    res.json({ periodo: { ano, quadrimestre }, equipes: vinculos });
  } catch (e) { err(res, e); }
});

// GET /api/monitor-aps/indicadores/historico
router.get('/historico', async (req, res) => {
  const { ine } = p(req);
  const indicadorId = Number(req.query.indicador_id);
  if (!ine) return res.status(400).json({ error: 'ine é obrigatório' });

  const anos = (req.query.anos || '2025').split(',').map(Number);
  const quads = [1, 2, 3];
  const fn = {
    1: calcularIndicador1,  2: calcularIndicador2,  3: calcularIndicador3,
    4: calcularIndicador4,  5: calcularIndicador5,  6: calcularIndicador6,
    7: calcularIndicador7,  8: calcularIndicador8,  9: calcularIndicador9,
    10: calcularIndicador10, 13: calcularIndicador13,
    14: calcularIndicador14, 15: calcularIndicador15,
  }[indicadorId];
  if (!fn) return res.status(404).json({ error: `Indicador ${indicadorId} não encontrado` });

  try {
    const historico = [];
    for (const ano of anos) {
      for (const quad of quads) {
        const d = await fn(ine, ano, quad).catch(() => null);
        if (d) historico.push({ ano, quadrimestre: quad, ...d.indicador?.resultado });
      }
    }
    res.json({ ine, indicador_id: indicadorId, historico });
  } catch (e) { err(res, e); }
});

// POST /api/monitor-aps/cache/clear
router.post('/cache/clear', (_req, res) => {
  clearCache();
  res.json({ success: true, message: 'Cache limpo' });
});

module.exports = router;
