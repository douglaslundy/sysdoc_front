export const dimensoesReduzidas = (largura, altura, lado) => {
  const maior = Math.max(largura, altura);
  if (maior <= lado) return { largura, altura };
  const fator = lado / maior;
  return { largura: Math.round(largura * fator), altura: Math.round(altura * fator) };
};

const comoJpeg = (nome) => `${nome.replace(/\.[^.]+$/, "")}.jpg`;

// Reduz para o lado maior `lado` e regrava em JPEG (remove EXIF/GPS embutido). Se algo falhar
// ou o resultado não ficar menor, devolve o arquivo original: o limite do servidor decide.
// shortcut: depende de createImageBitmap (iOS 15+/Android atuais); sem ele envia o original.
export async function comprimirImagem(arquivo, { lado = 1600, qualidade = 0.8 } = {}) {
  try {
    if (typeof createImageBitmap !== "function") return arquivo;

    const imagem = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
    const { largura, altura } = dimensoesReduzidas(imagem.width, imagem.height, lado);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    canvas.getContext("2d").drawImage(imagem, 0, 0, largura, altura);
    imagem.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", qualidade));
    if (!blob || blob.size >= arquivo.size) return arquivo;

    return new File([blob], comoJpeg(arquivo.name), { type: "image/jpeg", lastModified: Date.now() });
  } catch (e) {
    return arquivo;
  }
}
