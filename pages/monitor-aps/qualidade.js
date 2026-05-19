import dynamic from 'next/dynamic';

const IndicadoresQualidade = dynamic(() => import('@monitor-aps/pages/IndicadoresQualidade'), { ssr: false });

export default function MonitorApsQualidade() {
  return <IndicadoresQualidade />;
}
