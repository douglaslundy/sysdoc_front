import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('@monitor-aps/pages/Dashboard'), { ssr: false });

export default function MonitorApsDashboard() {
  return <Dashboard />;
}
