import Head from 'next/head';
import { Moldura } from './Moldura';
import { usePainelConfig } from './usePainelConfig';

/** Painel PSF: duas páginas lado a lado (esquerda com largura configurável, direita ocupa o resto). */
export default function PainelPsf() {
  const config = usePainelConfig();

  return (
    <div className="fixed inset-0 bg-black">
      <Head><title>Painel PSF</title></Head>
      {config && (
        <div className="flex h-full w-full flex-col md:flex-row" style={{ '--esq': `${config.largura_esquerda}%` }}>
          <div className="h-1/2 w-full md:h-full md:w-[var(--esq)] md:shrink-0"><Moldura url={config.esquerda_url} titulo="Coluna esquerda" /></div>
          <div className="h-1/2 w-full md:h-full md:min-w-0 md:flex-1"><Moldura url={config.direita_url} titulo="Coluna direita" /></div>
        </div>
      )}
    </div>
  );
}
