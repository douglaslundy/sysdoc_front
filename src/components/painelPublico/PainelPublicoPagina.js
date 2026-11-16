import Head from 'next/head';
import PainelPsf from './PainelPsf';
import { Moldura } from './Moldura';
import { apontaParaPainelPsf, usePainelConfig } from './usePainelConfig';

/** Rota /painel-publico: mostra a página que o admin escolheu (padrão: Painel PSF), sem login e sem cabeçalho. */
export default function PainelPublicoPagina() {
  const config = usePainelConfig();
  if (!config) return <div className="fixed inset-0 bg-black" />;
  if (apontaParaPainelPsf(config.pagina_url)) return <PainelPsf />;

  return (
    <div className="fixed inset-0 bg-black">
      <Head><title>Painel público</title></Head>
      <Moldura url={config.pagina_url} titulo="Painel público" />
    </div>
  );
}
