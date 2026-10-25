const dois = (n) => String(n).padStart(2, "0");

// Data local em yyyy-MM-dd. Nunca toISOString/new Date('yyyy-MM-dd'): ambos passam por UTC e erram um dia no Brasil.
export const formatarData = (data) => `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;

export const ultimos30Dias = (hoje = new Date()) => {
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29);
  return { de: formatarData(inicio), ate: formatarData(hoje) };
};
