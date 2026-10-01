import axios from "axios";

// Chamadas SEM autenticação (páginas públicas). Não usa a instância `api`, que injeta token.
const baseUrl = () => String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export async function listarMotivos() {
  const { data } = await axios.get(`${baseUrl()}/public/petition/reasons`);
  return Array.isArray(data) ? data : [];
}

export async function registrarPeticao(formData) {
  const { data } = await axios.post(`${baseUrl()}/public/petitions`, formData);
  return data;
}

export async function consultarPeticao({ protocolo, senha }) {
  const { data } = await axios.post(`${baseUrl()}/public/petitions/consulta`, { protocolo, senha });
  return data;
}
