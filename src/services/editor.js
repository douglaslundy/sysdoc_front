import { api } from "./api";

const UPLOAD = { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 };

/** Envia a imagem colada/escolhida no editor de texto; devolve { url }. */
export const enviarImagemEditor = (arquivo) => {
  const form = new FormData();
  form.append("imagem", arquivo);
  return api.post("/editor/imagens", form, UPLOAD).then((res) => res.data);
};
