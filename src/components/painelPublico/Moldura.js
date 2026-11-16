import { apontaParaPainelPublico } from './usePainelConfig';

// Páginas internas recebem ?embed=1 (o app esconde menu e cabeçalho); sites externos ficam como estão.
const comEmbed = (url) => {
  if (!url.startsWith('/')) return url;
  const [base, hash] = url.split('#');
  return `${base}${base.includes('?') ? '&' : '?'}embed=1${hash ? `#${hash}` : ''}`;
};

/** Página embutida sem borda, para dois conteúdos parecerem uma tela só. */
export function Moldura({ url, titulo }) {
  if (!url || apontaParaPainelPublico(url)) {
    return <div className="flex h-full w-full items-center justify-center bg-black p-4 text-center text-sm text-white/70">Página não configurada.</div>;
  }
  return <iframe src={comEmbed(url)} title={titulo} className="block h-full w-full border-0 bg-black" allow="autoplay; fullscreen" />;
}
