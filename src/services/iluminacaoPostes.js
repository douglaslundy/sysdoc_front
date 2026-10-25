import { api } from "./api";

const UPLOAD = { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 };

const montarForm = (campos = {}, fotos = []) => {
  const form = new FormData();
  Object.entries(campos).forEach(([chave, valor]) => {
    if (valor !== null && valor !== undefined) form.append(chave, valor);
  });
  Array.from(fotos).forEach((foto) => form.append("fotos[]", foto));
  return form;
};

const corpo = (res) => res.data;

export const listarPostes = (params) => api.get("/iluminacao/postes", { params }).then(corpo);
export const obterPoste = (id) => api.get(`/iluminacao/postes/${id}`).then(corpo);
export const obterHistorico = (id) => api.get(`/iluminacao/postes/${id}/historico`).then(corpo);

export const criarPoste = (dados, fotos) => api.post("/iluminacao/postes", montarForm(dados, fotos), UPLOAD).then(corpo);
export const atualizarPoste = (id, dados) => api.put(`/iluminacao/postes/${id}`, dados).then(corpo);
export const inativarPoste = (id) => api.delete(`/iluminacao/postes/${id}`).then(corpo);

export const enviarFotos = (id, fotos) => api.post(`/iluminacao/postes/${id}/fotos`, montarForm({}, fotos), UPLOAD).then(corpo);
export const apagarFoto = (id, fotoId) => api.delete(`/iluminacao/postes/${id}/fotos/${fotoId}`).then(corpo);
export const baixarFoto = (id, fotoId) =>
  api.get(`/iluminacao/postes/${id}/fotos/${fotoId}/download`, { responseType: "blob" }).then(corpo);

export const registrarDesfecho = (id, dados, fotos) =>
  api.post(`/iluminacao/postes/${id}/desfecho`, montarForm(dados, fotos), UPLOAD).then(corpo);
export const reabrirPoste = (id, motivo) => api.post(`/iluminacao/postes/${id}/reabrir`, { motivo }).then(corpo);
