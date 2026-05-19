const { getPool } = require('../config/database');
const { classificar, THRESHOLDS } = require('./classificacao.service');

// ---------------------------------------------------------------
// Indicador 13 — Acesso à Saúde Bucal
// Proporção de primeiras consultas odontológicas na população cadastrada
// ---------------------------------------------------------------
async function calcularIndicador13(ine, ano, quadrimestre) {
  const pool = getPool();

  const { rows: [den] } = await pool.query(`
    SELECT COUNT(DISTINCT fci.co_cidadao) AS total
    FROM fat_cad_individual fci
    JOIN dim_equipe de ON fci.co_dim_equipe = de.co_seq_dim_equipe
    WHERE de.nu_ine = $1 AND fci.st_ativo = true
  `, [ine]);
  const denominador = Number(den?.total) || 0;
  if (!denominador) return _semDados(13, 'Acesso à Saúde Bucal', ine, ano, quadrimestre);

  const { rows: [num] } = await pool.query(`
    SELECT COUNT(*) AS total
    FROM fat_atendimento_odontologico fao
    JOIN dim_equipe de ON fao.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fao.co_dim_tempo  = dt.co_seq_dim_tempo
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
      AND fao.st_primeira_consulta = true
  `, [ine, ano, quadrimestre]);
  const numerador  = Number(num?.total) || 0;
  const percentual = +(numerador / denominador * 100).toFixed(1);

  return _resultado(13, 'Acesso à Saúde Bucal', ine, ano, quadrimestre,
    numerador, denominador, percentual, THRESHOLDS.ind13_acesso_bucal,
    [{ nome: 'Primeiras consultas odontológicas', valor: numerador, total: denominador }]
  );
}

// ---------------------------------------------------------------
// Indicador 14 — Conclusão de Tratamento Odontológico
// ---------------------------------------------------------------
async function calcularIndicador14(ine, ano, quadrimestre) {
  const pool = getPool();

  const { rows: [total] } = await pool.query(`
    SELECT COUNT(*) AS total
    FROM fat_atendimento_odontologico fao
    JOIN dim_equipe de ON fao.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fao.co_dim_tempo  = dt.co_seq_dim_tempo
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
  `, [ine, ano, quadrimestre]);
  const denominador = Number(total?.total) || 0;
  if (!denominador) return _semDados(14, 'Conclusão de Tratamento Odontológico', ine, ano, quadrimestre);

  const { rows: [concl] } = await pool.query(`
    SELECT COUNT(*) AS total
    FROM fat_atendimento_odontologico fao
    JOIN dim_equipe de ON fao.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fao.co_dim_tempo  = dt.co_seq_dim_tempo
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
      AND fao.st_conclusao_tratamento = true
  `, [ine, ano, quadrimestre]);
  const numerador  = Number(concl?.total) || 0;
  const percentual = +(numerador / denominador * 100).toFixed(1);

  return _resultado(14, 'Conclusão de Tratamento Odontológico', ine, ano, quadrimestre,
    numerador, denominador, percentual, THRESHOLDS.ind14_conclusao,
    [{ nome: 'Tratamentos concluídos', valor: numerador, total: denominador }]
  );
}

// ---------------------------------------------------------------
// Indicador 15 — Ações Coletivas em Saúde Bucal
// ---------------------------------------------------------------
async function calcularIndicador15(ine, ano, quadrimestre) {
  const pool = getPool();

  const { rows: [r] } = await pool.query(`
    SELECT COUNT(*) AS atividades, COALESCE(SUM(nu_participantes), 0) AS participantes
    FROM fat_ativ_coletiva fac
    JOIN dim_equipe de ON fac.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fac.co_dim_tempo  = dt.co_seq_dim_tempo
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
  `, [ine, ano, quadrimestre]);

  const { rows: [den] } = await pool.query(`
    SELECT COUNT(DISTINCT fci.co_cidadao) AS total
    FROM fat_cad_individual fci
    JOIN dim_equipe de ON fci.co_dim_equipe = de.co_seq_dim_equipe
    WHERE de.nu_ine = $1 AND fci.st_ativo = true
  `, [ine]);

  const participantes = Number(r?.participantes) || 0;
  const denominador   = Number(den?.total)       || 1;
  const percentual    = +(participantes / denominador * 100).toFixed(1);

  return _resultado(15, 'Ações Coletivas em Saúde Bucal', ine, ano, quadrimestre,
    participantes, denominador, percentual, THRESHOLDS.ind15_coletivas,
    [
      { nome: 'Atividades coletivas realizadas', valor: Number(r?.atividades) || 0, total: '-' },
      { nome: 'Total de participantes',          valor: participantes,              total: denominador },
    ]
  );
}

async function calcularTodosIndicadoresESB(ine, ano, quadrimestre) {
  const [i13, i14, i15] = await Promise.all([
    calcularIndicador13(ine, ano, quadrimestre),
    calcularIndicador14(ine, ano, quadrimestre),
    calcularIndicador15(ine, ano, quadrimestre),
  ]);
  return [i13, i14, i15].filter(Boolean);
}

// Helpers
function _resultado(id, nome, ine, ano, quadrimestre, numerador, denominador, percentual, thresholds, subindicadores) {
  return {
    indicador: {
      id, nome, bloco: 'eSB',
      equipe: { ine, nome: '' },
      periodo: { ano: Number(ano), quadrimestre: Number(quadrimestre) },
      resultado: {
        numerador, denominador, percentual,
        classificacao:   classificar(percentual, thresholds),
        meta_suficiente: thresholds.suficiente,
        meta_bom:        thresholds.bom,
        meta_otimo:      thresholds.otimo,
      },
      subindicadores,
    },
  };
}

function _semDados(id, nome, ine, ano, quadrimestre) {
  return _resultado(id, nome, ine, ano, quadrimestre, 0, 0, 0, { suficiente: 0, bom: 0, otimo: 0 }, []);
}

module.exports = { calcularIndicador13, calcularIndicador14, calcularIndicador15, calcularTodosIndicadoresESB };
