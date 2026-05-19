const { getPool } = require('../config/database');
const { classificar, THRESHOLDS } = require('./classificacao.service');

const VACINAS_CALENDARIO = [
  '0301060029', // DTP
  '0301060100', // Hepatite B
  '0301060037', // Hib
  '0301060118', // Poliomielite
  '0301060196', // Tríplice viral (SCR)
  '0301060160', // Pneumocócica 10v
];

function periodo(ano, quad) {
  return { ano: Number(ano), quadrimestre: Number(quad) };
}

// ---------------------------------------------------------------
// Indicador 1 — Mais Acesso à Atenção Primária
// Mede diversidade de tipos de atendimento da equipe.
// Meta: ≥ 3 tipos de demanda com ≥ 10% cada.
// ---------------------------------------------------------------
async function calcularIndicador1(ine, ano, quadrimestre) {
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT
      de.nu_ine, de.no_equipe,
      COUNT(CASE WHEN fai.co_dim_tipo_atendimento = 1 THEN 1 END) AS programados,
      COUNT(CASE WHEN fai.co_dim_tipo_atendimento = 2 THEN 1 END) AS espontaneos,
      COUNT(CASE WHEN fai.co_dim_tipo_atendimento = 3 THEN 1 END) AS escuta_inicial,
      COUNT(CASE WHEN fai.co_dim_tipo_atendimento = 4 THEN 1 END) AS consulta_dia,
      COUNT(CASE WHEN fai.co_dim_tipo_atendimento = 5 THEN 1 END) AS urgencia,
      COUNT(*) AS total
    FROM fat_atendimento_individual fai
    JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fai.co_dim_tempo  = dt.co_seq_dim_tempo
    WHERE dt.nu_ano = $1 AND dt.nu_quadrimestre = $2
      AND de.nu_ine = $3 AND de.st_ativo = true
    GROUP BY de.nu_ine, de.no_equipe
  `, [ano, quadrimestre, ine]);

  if (!rows.length) return null;
  const r = rows[0];
  const total = Number(r.total) || 1;
  const tipos = [
    { nome: 'Demanda programada',      valor: Number(r.programados),   pct: +(Number(r.programados)   / total * 100).toFixed(1) },
    { nome: 'Demanda espontânea',      valor: Number(r.espontaneos),   pct: +(Number(r.espontaneos)   / total * 100).toFixed(1) },
    { nome: 'Escuta inicial',          valor: Number(r.escuta_inicial), pct: +(Number(r.escuta_inicial)/ total * 100).toFixed(1) },
    { nome: 'Consulta do dia',         valor: Number(r.consulta_dia),  pct: +(Number(r.consulta_dia)  / total * 100).toFixed(1) },
    { nome: 'Urgência / emergência',   valor: Number(r.urgencia),      pct: +(Number(r.urgencia)      / total * 100).toFixed(1) },
  ];
  const tiposAcima10 = tipos.filter(t => t.pct >= 10).length;
  const percentual   = +(tiposAcima10 / 5 * 100).toFixed(1);

  return _resultado(1, 'Mais Acesso à Atenção Primária', 'eSF_eAP', r, ano, quadrimestre,
    tiposAcima10, 5, percentual, THRESHOLDS.ind1_acesso_aps,
    tipos.map(t => ({ nome: t.nome, valor: t.valor, total: Number(r.total), pct: t.pct }))
  );
}

// ---------------------------------------------------------------
// Indicador 2 — Cuidado Longitudinal da Criança
// ---------------------------------------------------------------
async function calcularIndicador2(ine, ano, quadrimestre) {
  const pool = getPool();

  // Denominador: crianças < 24 meses cadastradas na equipe
  const { rows: [den] } = await pool.query(`
    SELECT COUNT(DISTINCT fci.co_cidadao) AS total
    FROM fat_cad_individual fci
    JOIN dim_equipe de ON fci.co_dim_equipe = de.co_seq_dim_equipe
    WHERE de.nu_ine = $1 AND fci.st_ativo = true
      AND fci.dt_nascimento > CURRENT_DATE - INTERVAL '24 months'
  `, [ine]);
  const denominador = Number(den?.total) || 0;
  if (!denominador) return _semDados(2, 'Cuidado Longitudinal da Criança', 'eSF_eAP', ine, ano, quadrimestre);

  // Sub 1: ≥9 consultas médico/enfermeiro
  const { rows: [sub1] } = await pool.query(`
    SELECT COUNT(DISTINCT fai.co_cidadao) AS v
    FROM fat_atendimento_individual fai
    JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fai.co_dim_tempo  = dt.co_seq_dim_tempo
    JOIN dim_cbo    dc ON fai.co_dim_cbo    = dc.co_seq_dim_cbo
    JOIN fat_cad_individual fci ON fai.co_cidadao = fci.co_cidadao
      AND fci.dt_nascimento > CURRENT_DATE - INTERVAL '24 months'
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
      AND dc.nu_cbo IN ('225142','225125','223505')
    GROUP BY fai.co_cidadao HAVING COUNT(*) >= 9
  `, [ine, ano, quadrimestre]);

  // Sub 2: ≥9 registros de antropometria
  const { rows: [sub2] } = await pool.query(`
    SELECT COUNT(DISTINCT fai.co_cidadao) AS v
    FROM fat_atendimento_individual fai
    JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fai.co_dim_tempo  = dt.co_seq_dim_tempo
    JOIN fat_cad_individual fci ON fai.co_cidadao = fci.co_cidadao
      AND fci.dt_nascimento > CURRENT_DATE - INTERVAL '24 months'
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
      AND fai.nu_peso IS NOT NULL
    GROUP BY fai.co_cidadao HAVING COUNT(*) >= 9
  `, [ine, ano, quadrimestre]);

  // Sub 3: ≥2 visitas ACS
  const { rows: [sub3] } = await pool.query(`
    SELECT COUNT(DISTINCT fvd.co_cidadao) AS v
    FROM fat_visita_domiciliar fvd
    JOIN dim_equipe de ON fvd.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fvd.co_dim_tempo  = dt.co_seq_dim_tempo
    JOIN dim_cbo    dc ON fvd.co_dim_cbo    = dc.co_seq_dim_cbo
    JOIN fat_cad_individual fci ON fvd.co_cidadao = fci.co_cidadao
      AND fci.dt_nascimento > CURRENT_DATE - INTERVAL '24 months'
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
      AND dc.nu_cbo = '516220' AND fvd.st_visita_realizada = true
    GROUP BY fvd.co_cidadao HAVING COUNT(*) >= 2
  `, [ine, ano, quadrimestre]);

  // Sub 4: vacinação completa (fat_vacinacao ou fat_procedimento_individual)
  const { rows: [sub4] } = await pool.query(`
    SELECT COUNT(DISTINCT fv.co_cidadao) AS v
    FROM fat_vacinacao fv
    JOIN dim_equipe de ON fv.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fv.co_dim_tempo  = dt.co_seq_dim_tempo
    JOIN fat_cad_individual fci ON fv.co_cidadao = fci.co_cidadao
      AND fci.dt_nascimento > CURRENT_DATE - INTERVAL '24 months'
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
      AND fv.nu_sigtap_imuno = ANY($4::varchar[])
    GROUP BY fv.co_cidadao HAVING COUNT(DISTINCT fv.nu_sigtap_imuno) >= 6
  `, [ine, ano, quadrimestre, VACINAS_CALENDARIO]);

  const vals = [sub1, sub2, sub3, sub4].map(s => Number(s?.v) || 0);
  const numerador  = Math.min(...vals);
  const percentual = +(numerador / denominador * 100).toFixed(1);

  return _resultado(2, 'Cuidado Longitudinal da Criança', 'eSF_eAP',
    { nu_ine: ine, no_equipe: '' }, ano, quadrimestre,
    numerador, denominador, percentual, THRESHOLDS.ind2_crianca, [
      { nome: '≥9 consultas médico/enfermeiro', valor: vals[0], total: denominador },
      { nome: '≥9 registros peso/altura',       valor: vals[1], total: denominador },
      { nome: '≥2 visitas ACS',                 valor: vals[2], total: denominador },
      { nome: 'Vacinação completa',             valor: vals[3], total: denominador },
    ]);
}

// ---------------------------------------------------------------
// Indicador 3 — Cuidado da Gestante e Puérpera
// ---------------------------------------------------------------
async function calcularIndicador3(ine, ano, quadrimestre) {
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT
      nu_ine, no_equipe,
      COUNT(*) AS denominador,
      SUM(CASE WHEN st_pn_adequado THEN 1 ELSE 0 END) AS numerador
    FROM vw_acompanhamento_pre_natal vpn
    JOIN dim_equipe de ON de.nu_ine = vpn.nu_ine
    JOIN dim_tempo  dt ON dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
    WHERE vpn.nu_ine = $1
    GROUP BY nu_ine, no_equipe
  `, [ine, ano, quadrimestre]);

  if (!rows.length) return _semDados(3, 'Cuidado da Gestante e Puérpera', 'eSF_eAP', ine, ano, quadrimestre);
  const r = rows[0];
  const num = Number(r.numerador); const den = Number(r.denominador);
  const percentual = den > 0 ? +(num / den * 100).toFixed(1) : 0;
  return _resultado(3, 'Cuidado da Gestante e Puérpera', 'eSF_eAP', r, ano, quadrimestre,
    num, den, percentual, THRESHOLDS.ind3_gestante,
    [{ nome: 'Pré-natal adequado (≥6 consultas)', valor: num, total: den }]
  );
}

// ---------------------------------------------------------------
// Indicador 4 — Cuidado da Pessoa com Hipertensão
// ---------------------------------------------------------------
async function calcularIndicador4(ine, ano, quadrimestre) {
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT nu_ine, no_equipe,
           COUNT(*) AS denominador,
           SUM(CASE WHEN st_acompanhado THEN 1 ELSE 0 END) AS numerador
    FROM vw_acompanhamento_hipertensao
    WHERE nu_ine = $1
    GROUP BY nu_ine, no_equipe
  `, [ine]);

  if (!rows.length) return _semDados(4, 'Cuidado da Pessoa com Hipertensão', 'eSF_eAP', ine, ano, quadrimestre);
  const r = rows[0];
  const num = Number(r.numerador); const den = Number(r.denominador);
  const percentual = den > 0 ? +(num / den * 100).toFixed(1) : 0;
  return _resultado(4, 'Cuidado da Pessoa com Hipertensão', 'eSF_eAP', r, ano, quadrimestre,
    num, den, percentual, THRESHOLDS.ind4_hipertensao,
    [{ nome: 'Hipertensos com ≥2 atendimentos', valor: num, total: den }]
  );
}

// ---------------------------------------------------------------
// Indicador 5 — Cuidado da Pessoa com Diabetes
// ---------------------------------------------------------------
async function calcularIndicador5(ine, ano, quadrimestre) {
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT nu_ine, no_equipe,
           COUNT(*) AS denominador,
           SUM(CASE WHEN st_acompanhado THEN 1 ELSE 0 END) AS numerador
    FROM vw_acompanhamento_diabetes
    WHERE nu_ine = $1
    GROUP BY nu_ine, no_equipe
  `, [ine]);

  if (!rows.length) return _semDados(5, 'Cuidado da Pessoa com Diabetes', 'eSF_eAP', ine, ano, quadrimestre);
  const r = rows[0];
  const num = Number(r.numerador); const den = Number(r.denominador);
  const percentual = den > 0 ? +(num / den * 100).toFixed(1) : 0;
  return _resultado(5, 'Cuidado da Pessoa com Diabetes', 'eSF_eAP', r, ano, quadrimestre,
    num, den, percentual, THRESHOLDS.ind5_diabetes,
    [{ nome: 'Diabéticos com ≥2 atendimentos', valor: num, total: den }]
  );
}

// ---------------------------------------------------------------
// Indicador 6 — Cuidado da Pessoa Idosa
// ---------------------------------------------------------------
async function calcularIndicador6(ine, ano, quadrimestre) {
  const pool = getPool();
  const { rows: [den] } = await pool.query(`
    SELECT COUNT(DISTINCT fci.co_cidadao) AS total
    FROM fat_cad_individual fci
    JOIN dim_equipe de ON fci.co_dim_equipe = de.co_seq_dim_equipe
    WHERE de.nu_ine = $1 AND fci.st_ativo = true
      AND fci.dt_nascimento < CURRENT_DATE - INTERVAL '60 years'
  `, [ine]);
  const denominador = Number(den?.total) || 0;
  if (!denominador) return _semDados(6, 'Cuidado da Pessoa Idosa', 'eSF_eAP', ine, ano, quadrimestre);

  const { rows: [num] } = await pool.query(`
    SELECT COUNT(DISTINCT fai.co_cidadao) AS total
    FROM fat_atendimento_individual fai
    JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fai.co_dim_tempo  = dt.co_seq_dim_tempo
    JOIN fat_cad_individual fci ON fai.co_cidadao = fci.co_cidadao
      AND fci.dt_nascimento < CURRENT_DATE - INTERVAL '60 years'
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
  `, [ine, ano, quadrimestre]);
  const numerador  = Number(num?.total) || 0;
  const percentual = +(numerador / denominador * 100).toFixed(1);
  return _resultado(6, 'Cuidado da Pessoa Idosa', 'eSF_eAP',
    { nu_ine: ine, no_equipe: '' }, ano, quadrimestre,
    numerador, denominador, percentual, THRESHOLDS.ind6_idoso,
    [{ nome: 'Idosos atendidos no quadrimestre', valor: numerador, total: denominador }]
  );
}

// ---------------------------------------------------------------
// Indicador 7 — Saúde Mental na APS
// ---------------------------------------------------------------
async function calcularIndicador7(ine, ano, quadrimestre) {
  const pool = getPool();
  const { rows: [total] } = await pool.query(`
    SELECT COUNT(*) AS total
    FROM fat_atendimento_individual fai
    JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fai.co_dim_tempo  = dt.co_seq_dim_tempo
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
  `, [ine, ano, quadrimestre]);

  const { rows: [sm] } = await pool.query(`
    SELECT COUNT(*) AS total
    FROM fat_atendimento_individual fai
    JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fai.co_dim_tempo  = dt.co_seq_dim_tempo
    LEFT JOIN dim_ciap2 dc ON fai.co_dim_ciap2_avaliado = dc.co_seq_dim_ciap2
    LEFT JOIN dim_cid10 di ON fai.co_dim_cid10_avaliado = di.co_seq_dim_cid10
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
      AND (dc.nu_ciap2 IN ('P76','P77','P78','P79','P80','P81','P82','P85','P86','P98','P99')
           OR di.nu_cid10 LIKE 'F%')
  `, [ine, ano, quadrimestre]);

  const numerador   = Number(sm?.total)    || 0;
  const denominador = Number(total?.total) || 1;
  const percentual  = +(numerador / denominador * 100).toFixed(1);
  return _resultado(7, 'Saúde Mental na APS', 'eSF_eAP',
    { nu_ine: ine, no_equipe: '' }, ano, quadrimestre,
    numerador, denominador, percentual, THRESHOLDS.ind7_saude_mental,
    [{ nome: 'Atendimentos de saúde mental', valor: numerador, total: denominador }]
  );
}

// ---------------------------------------------------------------
// Indicador 8 — Visita Domiciliar por ACS/TACS
// ---------------------------------------------------------------
async function calcularIndicador8(ine, ano, quadrimestre) {
  const pool = getPool();
  const { rows: [den] } = await pool.query(`
    SELECT COUNT(DISTINCT fci.co_cidadao) AS total
    FROM fat_cad_individual fci
    JOIN dim_equipe de ON fci.co_dim_equipe = de.co_seq_dim_equipe
    WHERE de.nu_ine = $1 AND fci.st_ativo = true
  `, [ine]);
  const denominador = Number(den?.total) || 0;
  if (!denominador) return _semDados(8, 'Visita Domiciliar por ACS/TACS', 'eSF_eAP', ine, ano, quadrimestre);

  const { rows: [num] } = await pool.query(`
    SELECT COUNT(DISTINCT fvd.co_cidadao) AS total
    FROM fat_visita_domiciliar fvd
    JOIN dim_equipe de ON fvd.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fvd.co_dim_tempo  = dt.co_seq_dim_tempo
    JOIN dim_cbo    dc ON fvd.co_dim_cbo    = dc.co_seq_dim_cbo
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
      AND dc.nu_cbo = '516220' AND fvd.st_visita_realizada = true
  `, [ine, ano, quadrimestre]);
  const numerador  = Number(num?.total) || 0;
  const percentual = +(numerador / denominador * 100).toFixed(1);
  return _resultado(8, 'Visita Domiciliar por ACS/TACS', 'eSF_eAP',
    { nu_ine: ine, no_equipe: '' }, ano, quadrimestre,
    numerador, denominador, percentual, THRESHOLDS.ind8_visita_acs,
    [{ nome: 'Pessoas com ≥1 visita ACS no quadrimestre', valor: numerador, total: denominador }]
  );
}

// ---------------------------------------------------------------
// Indicador 9 — Vacinação na APS
// ---------------------------------------------------------------
async function calcularIndicador9(ine, ano, quadrimestre) {
  const pool = getPool();
  const { rows: [den] } = await pool.query(`
    SELECT COUNT(DISTINCT fci.co_cidadao) AS total
    FROM fat_cad_individual fci
    JOIN dim_equipe de ON fci.co_dim_equipe = de.co_seq_dim_equipe
    WHERE de.nu_ine = $1 AND fci.st_ativo = true
      AND fci.dt_nascimento > CURRENT_DATE - INTERVAL '2 years'
  `, [ine]);
  const denominador = Number(den?.total) || 0;
  if (!denominador) return _semDados(9, 'Vacinação na APS', 'eSF_eAP', ine, ano, quadrimestre);

  const { rows: [num] } = await pool.query(`
    SELECT COUNT(DISTINCT fv.co_cidadao) AS total
    FROM fat_vacinacao fv
    JOIN dim_equipe de ON fv.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt ON fv.co_dim_tempo  = dt.co_seq_dim_tempo
    WHERE de.nu_ine = $1 AND dt.nu_ano = $2 AND dt.nu_quadrimestre = $3
      AND fv.nu_sigtap_imuno = ANY($4::varchar[]) AND fv.st_realizado = true
    GROUP BY fv.co_cidadao HAVING COUNT(DISTINCT fv.nu_sigtap_imuno) >= 4
  `, [ine, ano, quadrimestre, VACINAS_CALENDARIO]);
  const numerador  = Number(num?.total) || 0;
  const percentual = +(numerador / denominador * 100).toFixed(1);
  return _resultado(9, 'Vacinação na APS', 'eSF_eAP',
    { nu_ine: ine, no_equipe: '' }, ano, quadrimestre,
    numerador, denominador, percentual, THRESHOLDS.ind9_vacinacao,
    [{ nome: 'Crianças <2 anos com ≥4 vacinas do calendário', valor: numerador, total: denominador }]
  );
}

// ---------------------------------------------------------------
// Indicador 10 — Ações Interprofissionais
// ---------------------------------------------------------------
async function calcularIndicador10(ine, ano, quadrimestre) {
  const pool = getPool();
  const { rows: [r] } = await pool.query(`
    SELECT COUNT(*) AS total_atividades, SUM(nu_participantes) AS total_participantes
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

  const participantes = Number(r?.total_participantes) || 0;
  const denominador   = Number(den?.total) || 1;
  const percentual    = +(participantes / denominador * 100).toFixed(1);
  return _resultado(10, 'Ações Interprofissionais', 'eSF_eAP',
    { nu_ine: ine, no_equipe: '' }, ano, quadrimestre,
    participantes, denominador, percentual, THRESHOLDS.ind10_interprofissional,
    [
      { nome: 'Total de atividades coletivas', valor: Number(r?.total_atividades) || 0, total: '-' },
      { nome: 'Total de participantes',        valor: participantes, total: denominador },
    ]
  );
}

// ---------------------------------------------------------------
// Calcular todos os indicadores eSF/eAP para uma equipe
// ---------------------------------------------------------------
async function calcularTodosIndicadoresESF(ine, ano, quadrimestre) {
  const fns = [
    calcularIndicador1, calcularIndicador2, calcularIndicador3,
    calcularIndicador4, calcularIndicador5, calcularIndicador6,
    calcularIndicador7, calcularIndicador8, calcularIndicador9,
    calcularIndicador10,
  ];
  const resultados = await Promise.all(fns.map(fn => fn(ine, ano, quadrimestre).catch(e => ({ erro: e.message }))));
  return resultados.filter(Boolean);
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function _resultado(id, nome, bloco, row, ano, quadrimestre, numerador, denominador, percentual, thresholds, subindicadores) {
  return {
    indicador: {
      id, nome, bloco,
      equipe: { ine: row.nu_ine, nome: row.no_equipe || '' },
      periodo: { ano: Number(ano), quadrimestre: Number(quadrimestre) },
      resultado: {
        numerador,
        denominador,
        percentual,
        classificacao:   classificar(percentual, thresholds),
        meta_suficiente: thresholds.suficiente,
        meta_bom:        thresholds.bom,
        meta_otimo:      thresholds.otimo,
      },
      subindicadores,
    },
  };
}

function _semDados(id, nome, bloco, ine, ano, quadrimestre) {
  return _resultado(id, nome, bloco, { nu_ine: ine, no_equipe: '' }, ano, quadrimestre,
    0, 0, 0, { suficiente: 0, bom: 0, otimo: 0 }, []);
}

module.exports = {
  calcularIndicador1, calcularIndicador2, calcularIndicador3,
  calcularIndicador4, calcularIndicador5, calcularIndicador6,
  calcularIndicador7, calcularIndicador8, calcularIndicador9,
  calcularIndicador10, calcularTodosIndicadoresESF,
};
