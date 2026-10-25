import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Archive, FileText, Package, Shield, Thermometer, Truck, Users } from 'lucide-react';
import { api } from '../../services/api';
import { DashboardErro, getDashboardErrorMessage } from './DashboardStatus';
import { Esqueleto } from '../ui/esqueleto';

const SETOR_META = {
  farmacia: { Icone: Archive, destino: '/dashboard/farmacia' },
  vigilancia: { Icone: Shield, destino: '/dashboard/vigilancia' },
  almoxarifado: { Icone: Package, destino: '/dashboard/almoxarifado' },
  protocolo: { Icone: FileText, destino: '/protocolo/caixa-entrada' },
  laboratorio: { Icone: Thermometer, destino: '/dashboard/laboratorio' },
  fila: { Icone: Users, destino: '/dashboard/fila' },
  tfd: { Icone: Truck, destino: '/dashboard/tfd' },
};

const ORDEM_SETORES = ['farmacia', 'vigilancia', 'almoxarifado', 'protocolo', 'laboratorio', 'fila', 'tfd'];

function SetorCard({ chave, setor, onClick }) {
  const { Icone } = SETOR_META[chave];
  const alerta = Boolean(setor.alerta);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full w-full items-center justify-between gap-4 rounded-xl border border-t-2 border-border bg-card p-5 text-left transition-colors hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none ${
        alerta ? 'border-t-danger-strong' : 'border-t-info-strong'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-base text-muted-foreground">{setor.label}</span>
        <span className="block min-h-4 text-xs text-muted-foreground">{setor.kpi || ''}</span>
        <span className="mt-1 block font-mono text-3xl font-bold">{setor.valor ?? '—'}</span>
        <span className={`mt-2 block text-sm ${alerta ? 'font-bold text-danger' : 'text-muted-foreground'}`}>
          {alerta ? 'Requer atenção' : 'Sem pendências críticas'}
        </span>
      </span>
      <span className={`flex size-[72px] shrink-0 items-center justify-center rounded-full ${alerta ? 'bg-danger/15 text-danger' : 'bg-info/15 text-info'}`}>
        <Icone className="size-7" aria-hidden />
      </span>
    </button>
  );
}

export default function InicioDashboard({ onNavigateToSetor }) {
  const router = useRouter();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get('/dashboard/inicio')
      .then((res) => setDados(res.data))
      .catch((err) => setErro(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-2 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {ORDEM_SETORES.map((chave) => (
          <Esqueleto key={chave} className="h-[190px]" />
        ))}
      </div>
    );
  }

  if (erro || !dados?.setores) return <DashboardErro message={getDashboardErrorMessage('Inicio', erro)} />;

  const handleClick = (chave) => {
    const destino = SETOR_META[chave].destino;
    const trocouAba = onNavigateToSetor && onNavigateToSetor(destino);
    if (!trocouAba) router.push(destino);
  };

  const setoresVisiveis = ORDEM_SETORES.filter((chave) => dados.setores[chave]);

  if (setoresVisiveis.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-muted-foreground">Nenhum setor disponível para o seu perfil.</p>
      </div>
    );
  }

  return (
    <div className="mt-2 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {setoresVisiveis.map((chave) => (
        <SetorCard key={chave} chave={chave} setor={dados.setores[chave]} onClick={() => handleClick(chave)} />
      ))}
    </div>
  );
}
