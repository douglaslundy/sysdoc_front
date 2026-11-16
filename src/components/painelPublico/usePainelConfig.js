import { useEffect, useState } from 'react';
import { api } from '../../services/api';

const PADRAO = { pagina_url: '/painel-psf', esquerda_url: '/painel-esus', direita_url: '/transparency/medicines-panel', largura_esquerda: 60 };

/** Configuração do painel público (leitura sem login). Em falha de rede usa o padrão. */
export function usePainelConfig() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let vivo = true;
    api.get('/public/painel-publico', { publica: true })
      .then((r) => vivo && setConfig({ ...PADRAO, ...r.data }))
      .catch(() => vivo && setConfig(PADRAO));
    return () => { vivo = false; };
  }, []);

  return config;
}

// Impede o painel de abrir a si mesmo dentro de uma moldura (laço infinito).
export const apontaParaPainelPublico = (url) => /^\/painel-publico(\/|\?|#|$)/i.test(String(url || '').trim());

export const apontaParaPainelPsf = (url) => /^\/painel-psf(\/|\?|#|$)/i.test(String(url || '').trim());
