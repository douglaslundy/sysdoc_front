import { apontaParaPainelPublico } from './usePainelConfig';

/** Página embutida sem borda, para dois conteúdos parecerem uma tela só. */
export function Moldura({ url, titulo }) {
  if (!url || apontaParaPainelPublico(url)) {
    return <div className="flex h-full w-full items-center justify-center bg-black p-4 text-center text-sm text-white/70">Página não configurada.</div>;
  }
  return <iframe src={url} title={titulo} className="block h-full w-full border-0 bg-black" allow="autoplay; fullscreen" />;
}
