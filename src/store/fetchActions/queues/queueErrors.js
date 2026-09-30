// Mensagens de erro das operações da fila (baixa, exclusão...). Sempre devolvem um texto
// útil para a pessoa — nunca "undefined" — e deixam claro se a operação foi gravada ou não.

/** Observação da baixa: observação antiga + conclusão em maiúsculas, sem "null"/"undefined". */
export const buildConclusionObs = (obs, obsConclusion) =>
  [obs, String(obsConclusion ?? "").trim().toUpperCase()]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join("\n");

export const queueErrorMessage = (error, action = "concluir a operação") => {
  const response = error?.response;

  if (response) {
    const serverMessage = typeof response.data?.message === "string" ? response.data.message.trim() : "";

    if (response.status === 403) {
      return serverMessage || `Você não possui permissão para ${action}.`;
    }
    if (response.status >= 500) {
      return `Erro interno do servidor ao ${action}. A operação NÃO foi concluída. Tente novamente em instantes; se persistir, acione o suporte.`;
    }
    if (serverMessage) {
      return `${serverMessage} A operação NÃO foi registrada.`;
    }
    return `Não foi possível ${action}. A operação NÃO foi registrada.`;
  }

  if (error?.request) {
    return `Falha de conexão com o servidor ao ${action}. Não foi possível confirmar se a operação foi registrada: atualize a lista e confira antes de tentar novamente.`;
  }

  return `Não foi possível ${action}. A operação NÃO foi concluída.`;
};
