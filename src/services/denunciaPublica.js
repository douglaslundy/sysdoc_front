import axios from "axios";

// Chamadas SEM autenticação (páginas públicas). Não usa a instância `api`, que injeta token.
const baseUrl = () => String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export async function registrarDenuncia(formData) {
  const { data } = await axios.post(`${baseUrl()}/public/denuncias`, formData);
  return data;
}

export async function consultarDenuncia({ protocolo, senha }) {
  const { data } = await axios.post(`${baseUrl()}/public/denuncias/consulta`, { protocolo, senha });
  return data;
}
