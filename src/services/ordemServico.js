import { api } from "./api";

const UPLOAD = { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 };

const montarForm = (campos = {}, fotos = []) => {
  const form = new FormData();
  Object.entries(campos).forEach(([chave, valor]) => {
    if (valor !== null && valor !== undefined && valor !== "") form.append(chave, valor);
  });
  Array.from(fotos).forEach((foto) => form.append("fotos[]", foto));
  return form;
};

const corpo = (res) => res.data;

export const listarOs = (params) => api.get("/ordens-servico", { params }).then(corpo);
export const obterOs = (id) => api.get(`/ordens-servico/${id}`).then(corpo);
export const criarOs = (dados, fotos) => api.post("/ordens-servico", montarForm(dados, fotos), UPLOAD).then(corpo);
export const atribuirOs = (id, tecnico_id) => api.post(`/ordens-servico/${id}/atribuir`, { tecnico_id }).then(corpo);
export const iniciarOs = (id) => api.post(`/ordens-servico/${id}/iniciar`).then(corpo);
export const concluirOs = (id, dados, fotos) => api.post(`/ordens-servico/${id}/concluir`, montarForm(dados, fotos), UPLOAD).then(corpo);
export const cancelarOs = (id, observacao) => api.post(`/ordens-servico/${id}/cancelar`, { observacao }).then(corpo);
export const secretariasDeOs = () => api.get("/ordens-servico/secretarias").then(corpo);
export const tecnicosDeOs = (secretaria_id) => api.get("/ordens-servico/tecnicos", { params: { secretaria_id } }).then(corpo);
export const baixarFotoOs = (id, fotoId) => api.get(`/ordens-servico/${id}/fotos/${fotoId}`, { responseType: "blob" }).then(corpo);
export const baixarPdfOs = (id) => api.get(`/ordens-servico/${id}/pdf`, { responseType: "blob" }).then(corpo);

export const listarTipos = (secretaria_id, todos = false) => api.get("/os-tipos", { params: { secretaria_id, todos: todos ? 1 : undefined } }).then(corpo);
export const criarTipo = (dados) => api.post("/os-tipos", dados).then(corpo);
export const atualizarTipo = (id, dados) => api.put(`/os-tipos/${id}`, dados).then(corpo);
export const listarConfiguracoes = () => api.get("/os-configuracao").then(corpo);
export const salvarConfiguracao = (dados) => api.put("/os-configuracao", dados).then(corpo);
