// Mensagem para mostrar ao usuário a partir de um erro do axios (API Laravel).
export const mensagemDeErro = (e, padrao = "Não foi possível concluir a operação.") => {
  if (!e?.response) return "Sem conexão. Verifique a internet e tente de novo; o que você preencheu foi mantido.";
  const { status, data } = e.response;
  const erros = data?.errors;
  if (typeof erros === "string" && erros.trim()) return erros;
  if (erros && typeof erros === "object") {
    const primeiro = Object.values(erros).flat()[0];
    if (primeiro) return primeiro;
  }
  const msg = typeof data?.message === "string" ? data.message.trim() : "";
  // "Server Error" é a resposta genérica do Laravel em produção: não diz nada ao usuário.
  if (status >= 500 && (!msg || msg === "Server Error")) {
    return `${padrao} Erro interno no servidor (código ${status}); ele foi registrado em Logs de erro.`;
  }
  if (status === 403 && !msg) return "Você não tem permissão para esta ação.";
  return msg || padrao;
};
