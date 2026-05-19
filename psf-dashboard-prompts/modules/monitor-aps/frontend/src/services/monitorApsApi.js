const BASE = '/api/monitor-aps';

async function _get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}
async function _post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export const monitorApsApi = {
  // Config
  getStatus:      ()       => _get(`${BASE}/config/status`),
  testConnection: (config) => _post(`${BASE}/config/test`, config),
  saveConfig:     (config) => _post(`${BASE}/config/save`, config),
  getEquipes:     ()       => _get(`${BASE}/config/equipes`),

  // Indicadores
  getResumo:    (ano, quad)             => _get(`${BASE}/indicadores/resumo?ano=${ano}&quadrimestre=${quad}`),
  getVinculo:   (ano, quad, ine)        => _get(`${BASE}/indicadores/vinculo?ano=${ano}&quadrimestre=${quad}${ine ? `&ine=${ine}` : ''}`),
  getQualidade: (ano, quad, ine, bloco) => _get(`${BASE}/indicadores/qualidade?ano=${ano}&quadrimestre=${quad}${ine ? `&ine=${ine}` : ''}${bloco ? `&bloco=${bloco}` : ''}`),
  getIndicador: (id, ano, quad, ine)    => _get(`${BASE}/indicadores/qualidade/${id}?ano=${ano}&quadrimestre=${quad}&ine=${ine}`),
  getRepasse:   (ano, quad)             => _get(`${BASE}/indicadores/repasse?ano=${ano}&quadrimestre=${quad}`),
  getEquipesList: (ano, quad)           => _get(`${BASE}/indicadores/equipes?ano=${ano}&quadrimestre=${quad}`),
  getHistorico: (ine, id, anos)         => _get(`${BASE}/indicadores/historico?ine=${ine}&indicador_id=${id}&anos=${anos}`),
  clearCache:   ()                      => _post(`${BASE}/indicadores/cache/clear`, {}),
};
