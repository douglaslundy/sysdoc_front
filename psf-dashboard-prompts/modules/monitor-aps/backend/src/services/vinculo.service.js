const { getPool } = require('../config/database');
const { classificar } = require('./classificacao.service');

const THRESHOLDS_VINCULO = { regular: 0, suficiente: 40, bom: 65, otimo: 85 };

async function calcularVinculo(ano, quadrimestre, ine = null) {
  const pool = getPool();
  const params = [ano, quadrimestre];
  const filtroIne = ine ? `AND de.nu_ine = $${params.push(ine)}` : '';

  const { rows } = await pool.query(`
    SELECT
      de.nu_ine,
      de.no_equipe,
      de.nu_cnes,
      CASE de.tp_equipe
        WHEN 70 THEN 'eSF' WHEN 71 THEN 'eAP'
        WHEN 72 THEN 'eSB' WHEN 80 THEN 'eMulti'
        ELSE de.tp_equipe::text
      END AS tipo,
      COUNT(DISTINCT fci.co_cidadao)                                        AS total_cadastros_ind,
      COUNT(DISTINCT fcd.co_cidadao_responsavel)                            AS total_cadastros_dom,
      COUNT(DISTINCT CASE WHEN fci.st_bolsa_familia THEN fci.co_cidadao END) AS bolsa_familia,
      COUNT(DISTINCT CASE WHEN fci.st_bpc          THEN fci.co_cidadao END) AS bpc,
      COUNT(DISTINCT CASE
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, fci.dt_nascimento)) < 5
        THEN fci.co_cidadao END)                                            AS criancas_0_5,
      COUNT(DISTINCT CASE
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, fci.dt_nascimento)) >= 60
        THEN fci.co_cidadao END)                                            AS idosos_60_mais,
      -- Cadastros atualizados no quadrimestre consultado (proxy: co_dim_tempo)
      COUNT(DISTINCT CASE
        WHEN dt.nu_ano = $1 AND dt.nu_quadrimestre = $2
        THEN fci.co_cidadao END)                                            AS atualizados_quad
    FROM fat_cad_individual fci
    JOIN dim_equipe de  ON fci.co_dim_equipe = de.co_seq_dim_equipe
    JOIN dim_tempo  dt  ON fci.co_dim_tempo  = dt.co_seq_dim_tempo
    LEFT JOIN fat_cad_domiciliar fcd ON fci.co_cidadao = fcd.co_cidadao_responsavel
    WHERE de.st_ativo = true AND fci.st_ativo = true ${filtroIne}
    GROUP BY de.nu_ine, de.no_equipe, de.nu_cnes, de.tp_equipe
    ORDER BY de.tp_equipe, de.no_equipe
  `, params);

  return rows.map(r => {
    const ind = Number(r.total_cadastros_ind);
    const dom = Number(r.total_cadastros_dom);
    // Pontuação: 1,5 pts por cadastro com domiciliar, 0,75 só individual
    const pontuacao = (dom * 1.5) + ((ind - dom) * 0.75);
    const pct_completude = ind > 0 ? Math.round((dom / ind) * 100 * 10) / 10 : 0;
    const pct_atualizados = ind > 0 ? Math.round((Number(r.atualizados_quad) / ind) * 100 * 10) / 10 : 0;
    const classificacao = classificar(pct_completude, THRESHOLDS_VINCULO);

    return {
      ine: r.nu_ine,
      nome: r.no_equipe,
      cnes: r.nu_cnes,
      tipo: r.tipo,
      cadastros: {
        individuais: ind,
        domiciliares: dom,
        pct_completude,
        pct_atualizados,
        pontuacao: Math.round(pontuacao * 100) / 100,
      },
      grupos_prioritarios: {
        criancas_0_5:  Number(r.criancas_0_5),
        idosos_60_mais: Number(r.idosos_60_mais),
        bolsa_familia: Number(r.bolsa_familia),
        bpc:           Number(r.bpc),
      },
      classificacao,
    };
  });
}

module.exports = { calcularVinculo };
