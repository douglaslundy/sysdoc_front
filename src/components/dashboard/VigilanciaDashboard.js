import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertOctagon, AlertTriangle, Calendar, CheckCircle, Clipboard, Home, MessageCircle, Shield } from 'lucide-react';
import { ColorModeContext } from '../../contexts/ThemeContext';
import { DataTable } from '../ui/data-table';
import { Esqueleto } from '../ui/esqueleto';
import { Grade } from '../ui/grade';
import { StatCard } from '../ui/stat-card';
import { normalizeIconName } from '../../utils/iconResolver';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { DashboardErro, getDashboardErrorMessage } from './DashboardStatus';

const RISCO_COR = { '1': '#4caf50', '2': '#ff9800', '3': '#f44336', 'N/A': '#607d8b' };
const RISCO_ORDEM = ['1', '2', '3', 'N/A'];

function normalizarRisco(valor) {
  const v = String(valor ?? '').trim().toUpperCase();
  if (v === '1' || v === '2' || v === '3') return v;
  if (v === 'N/A' || v === 'NA') return 'N/A';
  return 'N/A';
}

const ICONES = { 'alert-circle': AlertCircle, 'alert-octagon': AlertOctagon, 'alert-triangle': AlertTriangle, 'calendar': Calendar, 'check-circle': CheckCircle, 'clipboard': Clipboard, 'home': Home, 'message-circle': MessageCircle, 'shield': Shield };

const TOMS = { '#00acc1': 'info', '#2196f3': 'info', '#4caf50': 'sucesso', '#607d8b': 'info', '#f44336': 'perigo', '#ff5722': 'perigo' };

function CardTotal({ icon, titulo, valor, cor }) {
    return <StatCard Icone={ICONES[icon]} tom={TOMS[cor] || 'primario'} titulo={titulo} valor={valor ?? '—'} />;
}

function gerarMesesFromMap(mapa) {
  const meses = [];
  const valores = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    meses.push(label);
    valores.push((mapa && mapa[chave]) ? Number(mapa[chave]) : 0);
  }
  return { meses, valores };
}

export default function VigilanciaDashboard() {
  const { mode } = useContext(ColorModeContext);
  const isDarkMode = mode === 'dark';
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get('/dashboard/vigilancia')
      .then(res => setDados(res.data))
      .catch((err) => setErro(err))
      .finally(() => setLoading(false));
  }, []);

  const chart = useMemo(() => {
    if (!dados) return null;

    const porMes = gerarMesesFromMap(dados.por_mes || {});
    const statusEntries = Object.entries(dados.por_status || {});
    const statusLabels = statusEntries.map(([s]) => s || 'Sem status');
    const statusValues = statusEntries.map(([, v]) => Number(v));

    const riscoNormalizado = {};
    Object.entries(dados.por_nivel_risco || {}).forEach(([r, v]) => {
      const risco = normalizarRisco(r);
      riscoNormalizado[risco] = (riscoNormalizado[risco] || 0) + Number(v || 0);
    });

    const riscoKeys = RISCO_ORDEM.filter((r) => Number(riscoNormalizado[r] || 0) > 0);
    const riscoLabels = riscoKeys.map((r) => `Risco ${r}`);
    const riscoValues = riscoKeys.map((r) => Number(riscoNormalizado[r] || 0));
    const riscoCores = riscoKeys.map((r) => RISCO_COR[r] || '#607d8b');

    const proximos = (dados.proximos_vencimentos || []).map((alv) => ({
      ...alv,
      nivel_risco: normalizarRisco(alv?.nivel_risco),
    }));

    return { porMes, statusLabels, statusValues, riscoLabels, riscoValues, riscoCores, proximos };
  }, [dados]);

  if (loading) {
    return (
      <div>
        <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Esqueleto className="h-24" key={`metric-${index}`} />
          ))}
        </div>
        <Grade container spacing={3}>
          <Grade item xs={12} md={6}>
            <Esqueleto className="h-[300px]" />
          </Grade>
          <Grade item xs={12} md={6}>
            <Esqueleto className="h-[300px]" />
          </Grade>
          <Grade item xs={12}>
            <Esqueleto className="h-80" />
          </Grade>
        </Grade>
      </div>
    );
  }

  if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('Vigilância Sanitária', erro)} />;

  const { totais } = dados;
  // Payload em cache anterior à T9 pode não ter o bloco; mostra zeros em vez de quebrar.
  const fiscalizacoes = dados.fiscalizacoes || { no_ano: 0, no_mes: 0, denuncias_pendentes: 0, autos_infracao_ano: 0 };
  const chartFont = { fontFamily: "'DM Sans', sans-serif" };
  const toolbarOff = { toolbar: { show: false } };

  const formatDate = (s) => {
    if (!s) return '-';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
  };

  const colunasVencimentos = [
    { chave: 'numero', titulo: 'Número', render: (alv) => <span className="font-semibold">{alv.numero_alvara}</span> },
    { chave: 'estabelecimento', titulo: 'Estabelecimento', render: (alv) => alv.estabelecimento?.nome_estabelecimento?.toUpperCase() ?? '-' },
    {
      chave: 'risco',
      titulo: 'Risco',
      render: (alv) => {
        const risco = normalizarRisco(alv.nivel_risco);
        const corRisco = RISCO_COR[risco] || '#607d8b';
        return (
          <span
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: isDarkMode ? `${corRisco}33` : `${corRisco}22`,
              color: isDarkMode ? corRisco : '#0f172a',
              borderColor: isDarkMode ? `${corRisco}44` : `${corRisco}88`,
            }}
          >
            {`Risco ${risco}`}
          </span>
        );
      },
    },
    { chave: 'status', titulo: 'Status', render: (alv) => alv.status || '-' },
    { chave: 'vencimento', titulo: 'Vencimento', render: (alv) => <span className="font-semibold text-primary-text">{formatDate(alv.vencimento_alvara)}</span> },
  ];
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-5">
        <CardTotal icon="home" titulo="Estabelecimentos" valor={totais.estabelecimentos} cor="#2196f3" />
        <CardTotal icon="shield" titulo="Alvarás" valor={totais.alvaras} cor="#607d8b" />
        <CardTotal icon="check-circle" titulo="Vigentes" valor={totais.vigentes} cor="#4caf50" />
        <CardTotal icon="alert-circle" titulo="Vencidos" valor={totais.vencidos} cor="#f44336" />
        <CardTotal icon="alert-triangle" titulo="Vencem em 30d" valor={totais.vencendo_em_30} cor="#ff5722" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        <CardTotal icon="clipboard" titulo="Fiscalizações no ano" valor={fiscalizacoes.no_ano} cor="#2196f3" />
        <CardTotal icon="calendar" titulo="Fiscalizações no mês" valor={fiscalizacoes.no_mes} cor="#00acc1" />
        <CardTotal
          icon="message-circle"
          titulo="Denúncias pendentes"
          valor={fiscalizacoes.denuncias_pendentes}
          cor={Number(fiscalizacoes.denuncias_pendentes) > 0 ? '#ff9800' : '#4caf50'}
        />
        <CardTotal icon="alert-octagon" titulo="Autos de infração no ano" valor={fiscalizacoes.autos_infracao_ano} cor="#f44336" />
      </div>

      <div className="mb-6 grid items-stretch gap-4 md:grid-cols-2">
        <BaseCard title="Alvarás por Status">
          {chart.statusLabels.length > 0 ? (
            <Chart
              type="bar"
              height={300}
              options={{
                chart: { ...chartFont, ...toolbarOff },
                plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                colors: ['#2196f3'],
                xaxis: {
                  categories: chart.statusLabels,
                  labels: { style: { colors: '#b0bec5' } },
                },
                yaxis: {
                  labels: { style: { colors: '#b0bec5', fontSize: '11px' } },
                },
                dataLabels: { enabled: false },
                tooltip: { theme: 'dark' },
                grid: { borderColor: 'transparent' },
              }}
              series={[{ name: 'Alvarás', data: chart.statusValues }]}
            />
          ) : <p className="mt-8 text-center text-muted-foreground">Sem dados</p>}
        </BaseCard>

        <BaseCard title="Por Nível de Risco">
          {chart.riscoLabels.length > 0 ? (
            <div className="mx-auto flex min-h-[260px] w-full items-center justify-center overflow-visible pb-3 [&_.apexcharts-canvas]:!overflow-visible [&_.apexcharts-inner]:!overflow-visible [&_.apexcharts-legend]:!overflow-visible">
              <Chart
                type="donut"
                height={300}
                options={{
                  chart: { ...chartFont, width: '100%' },
                  labels: chart.riscoLabels,
                  colors: chart.riscoCores,
                  legend: {
                    position: 'bottom',
                    horizontalAlign: 'center',
                    offsetY: 8,
                    labels: { colors: isDarkMode ? '#ffffff' : '#546e7a' },
                  },
                  plotOptions: { pie: { donut: { size: '68%' } } },
                  dataLabels: { enabled: true },
                  tooltip: { theme: 'dark' },
                }}
                series={chart.riscoValues}
              />
            </div>
          ) : <p className="mt-8 text-center text-muted-foreground">Sem dados</p>}
        </BaseCard>
      </div>

      <Grade container spacing={3}>
        <Grade item xs={12}>
          <BaseCard title="Alvarás Emitidos por Mês (últimos 12 meses)">
            <Chart
              type="area"
              height={300}
              options={{
                chart: { ...chartFont, ...toolbarOff },
                colors: ['#4caf50'],
                xaxis: {
                  categories: chart.porMes.meses,
                  labels: {
                    style: { colors: '#b0bec5', fontSize: '11px' },
                    formatter: v => typeof v === 'string' ? v.toUpperCase() : v,
                  },
                },
                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
                stroke: { curve: 'smooth', width: 3 },
                dataLabels: { enabled: false },
                tooltip: { theme: 'dark' },
                grid: { borderColor: 'transparent' },
              }}
              series={[{ name: 'Alvarás', data: chart.porMes.valores }]}
            />
          </BaseCard>
        </Grade>

        {chart.proximos.length > 0 && (
          <Grade item xs={12}>
            <BaseCard title="Próximos Vencimentos">
              <DataTable
                rotulo="próximos vencimentos"
                colunas={colunasVencimentos}
                linhas={chart.proximos}
                chaveDaLinha={(alv) => alv.id}
              />
            </BaseCard>
          </Grade>
        )}
      </Grade>
    </div>
  );
}
