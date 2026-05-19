import dynamic from 'next/dynamic';

const PorEquipe = dynamic(() => import('@monitor-aps/pages/PorEquipe'), { ssr: false });

export default function MonitorApsEquipe() {
  return <PorEquipe />;
}
