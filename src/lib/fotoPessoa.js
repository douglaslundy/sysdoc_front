import { useEffect, useState } from 'react';
import { api } from '../services/api';

const EVENTO = 'sysdoc:foto-alterada';
const LADO_MAX = 640;

/** Avisa quem exibe a foto (avatar do cabeçalho, modais) que ela mudou. */
export function avisarFotoAlterada(tipo, id) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENTO, { detail: { tipo, id } }));
}

/** Reduz a imagem (arquivo ou captura da webcam) a um JPEG de até 640 px: upload leve e sem foto de 12 MP. */
export function reduzirImagem(origem, tipoSaida = 'image/jpeg', qualidade = 0.85) {
  return new Promise((resolve, reject) => {
    const url = origem instanceof Blob ? URL.createObjectURL(origem) : null;
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * escala);
      canvas.height = Math.round(img.naturalHeight * escala);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      if (url) URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível processar a imagem.'))), tipoSaida, qualidade);
    };
    img.onerror = () => {
      if (url) URL.revokeObjectURL(url);
      reject(new Error('Arquivo de imagem inválido.'));
    };
    img.src = url || origem;
  });
}

export async function enviarFoto(tipo, id, blob) {
  const form = new FormData();
  form.append('photo', blob, 'foto.jpg');
  await api.post(`/${tipo}/${id}/photo`, form);
  avisarFotoAlterada(tipo, id);
}

export async function removerFoto(tipo, id) {
  await api.delete(`/${tipo}/${id}/photo`);
  avisarFotoAlterada(tipo, id);
}

/** URL (blob) da foto da pessoa, ou null se não tiver. A rota exige login, por isso não dá para usar <img src> direto. */
export function useFotoPessoa(tipo, id) {
  const [url, setUrl] = useState(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const aoAlterar = (e) => {
      if (e.detail?.tipo === tipo && String(e.detail?.id) === String(id)) setVersao((v) => v + 1);
    };
    window.addEventListener(EVENTO, aoAlterar);
    return () => window.removeEventListener(EVENTO, aoAlterar);
  }, [tipo, id]);

  useEffect(() => {
    if (!id) {
      setUrl(null);
      return undefined;
    }
    let cancelado = false;
    let objeto = null;
    api.get(`/${tipo}/${id}/photo`, { responseType: 'blob' })
      .then((res) => {
        if (cancelado) return;
        objeto = URL.createObjectURL(res.data);
        setUrl(objeto);
      })
      .catch(() => { if (!cancelado) setUrl(null); });
    return () => {
      cancelado = true;
      if (objeto) URL.revokeObjectURL(objeto);
    };
  }, [tipo, id, versao]);

  return url;
}
