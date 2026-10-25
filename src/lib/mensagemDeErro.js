// Mensagem para mostrar ao usuário a partir de um erro do axios (API Laravel).
export const mensagemDeErro = (e, padrao = "Não foi possível concluir a operação.") => {
  if (!e?.response) return "Sem conexão. Verifique a internet e tente de novo; o que você preencheu foi mantido.";
  const erros = e.response.data?.errors;
  if (erros) return Object.values(erros).flat()[0];
  return e.response.data?.message || padrao;
};
