import dynamic from 'next/dynamic';

const VinculoTerritorial = dynamic(() => import('@monitor-aps/pages/VinculoTerritorial'), { ssr: false });

export default function MonitorApsVinculo() {
  return <VinculoTerritorial />;
}
