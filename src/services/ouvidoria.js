import { api } from "./api";

const corpo = (res) => res.data;
// Sem token e sem X-Secretaria-Id (ver api.js): o portal público não tem sessão.
const PUBLICA = { publica: true };
const UPLOAD = { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 };

const montarForm = (campos = {}, anexos = []) => {
  const form = new FormData();
  Object.entries(campos).forEach(([chave, valor]) => {
    if (valor !== null && valor !== undefined && valor !== "") form.append(chave, valor);
  });
  Array.from(anexos).forEach((arquivo) => form.append("anexos[]", arquivo));
  return form;
};

// ---- portal público ----
export const buscarConfigPortal = () => api.get("/public/ouvidoria/config", PUBLICA).then(corpo);
export const opcoesOuvidoria = () => api.get("/public/ouvidoria/opcoes", PUBLICA).then(corpo);
export const registrarOuvidoria = (dados, anexos = []) =>
  api.post("/public/ouvidoria", montarForm(dados, anexos), { ...PUBLICA, ...UPLOAD }).then(corpo);
export const consultarOuvidoria = (protocolo, senha) =>
  api.post("/public/ouvidoria/consulta", { protocolo, senha }, PUBLICA).then(corpo);

// ---- área interna ----
export const listarManifestacoes = (params) => api.get("/ouvidoria", { params }).then(corpo);
export const obterManifestacao = (id) => api.get(`/ouvidoria/${id}`).then(corpo);
export const responderManifestacao = (id, resposta) => api.post(`/ouvidoria/${id}/responder`, { resposta }).then(corpo);
export const mudarStatusManifestacao = (id, status, observacao) =>
  api.post(`/ouvidoria/${id}/status`, { status, observacao }).then(corpo);
export const comentarManifestacao = (id, observacao) => api.post(`/ouvidoria/${id}/comentarios`, { observacao }).then(corpo);
export const encaminharManifestacao = (id, dados) => api.post(`/ouvidoria/${id}/encaminhar`, dados).then(corpo);
export const revelarDadosOuvidoria = (id) => api.post(`/ouvidoria/${id}/dados-pessoais`).then(corpo);
export const destinatariosOuvidoria = () => api.get("/ouvidoria/destinatarios").then(corpo);
export const baixarAnexoOuvidoria = (id, anexoId) => api.get(`/ouvidoria/${id}/anexos/${anexoId}`, { responseType: "blob" }).then(corpo);
