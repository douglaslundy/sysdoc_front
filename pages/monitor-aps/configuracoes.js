import dynamic from 'next/dynamic';

const Configuracoes = dynamic(() => import('@monitor-aps/pages/Configuracoes'), { ssr: false });

export default function MonitorApsConfiguracoes() {
  return <Configuracoes />;
}
