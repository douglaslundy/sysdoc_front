import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle, Clock, Monitor, Shield, Users, XCircle } from 'lucide-react';
import { ColorModeContext } from '../../contexts/ThemeContext';
import { Esqueleto } from '../ui/esqueleto';
import { Grade } from '../ui/grade';
import { StatCard } from '../ui/stat-card';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { DashboardErro, getDashboardErrorMessage } from './DashboardStatus';

const STATUS_STYLES = {
  online: '#4caf50',
  offline: '#ef5350',
  neutral: '#1e88e5',
  notice: '#ff9800',
};

const ICONES = { 'bell': Bell, 'check-circle': CheckCircle, 'clock': Clock, 'monitor': Monitor, 'shield': Shield, 'users': Users, 'x-circle': XCircle };

const TOMS = {  };

function CardTotal({ icon, titulo, valor, cor }) {
    return <StatCard Icone={ICONES[icon]} tom={TOMS[cor] || 'primario'} titulo={titulo} valor={valor ?? '—'} />;
}

function LoadingState() {
  return (
    <div className="ui-reset">
      <Grade container spacing={3}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Grade item xs={12} sm={6} md={3} key={index}>
            <Esqueleto className="h-[126px]" />
          </Grade>
        ))}
      </Grade>
      <Grade container spacing={3} mt={0.5}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Grade item xs={12} md={4} key={`chart-${index}`}>
            <Esqueleto className="h-[360px]" />
          </Grade>
        ))}
      </Grade>
      <Grade container spacing={3} mt={0.5}>
        {Array.from({ length: 2 }).map((_, index) => (
          <Grade item xs={12} md={6} key={`list-${index}`}>
            <Esqueleto className="h-80" />
          </Grade>
        ))}
      </Grade>
    </div>
  );
}

function formatRelativeTime(value) {
  if (!value) return 'Sem registro';

  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return 'Sem registro';

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'Agora mesmo';
  if (diffMinutes < 60) return `há ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
}

function formatSeenLabel(item) {
  if (!item?.last_seen_at) return 'Sem registro';
  return item.is_online ? `Online ${formatRelativeTime(item.last_seen_at)}` : `Offline ${formatRelativeTime(item.last_seen_at)}`;
}

function normalizeSeries(rows = []) {
  return rows.map((row) => ({
    label: row.label,
    total: Number(row.total || 0),
  }));
}

function RecentPresenceCard({ title, rows = [], emptyLabel, accent }) {
  return (
    <BaseCard title={title}>
      {rows.length > 0 ? (
        <ul className="divide-y divide-border">
          {rows.map((row, index) => (
            <li key={`${row.id || row.cnes || index}`} className="flex items-start gap-3 py-3">
              <span
                className="mt-1.5 size-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: row.is_online ? STATUS_STYLES.online : STATUS_STYLES.offline,
                  boxShadow: `0 0 14px ${row.is_online ? 'rgba(76,175,80,0.45)' : 'rgba(239,83,80,0.45)'}`,
                }}
              />
              <div className="min-w-0">
                <p className="font-semibold">{row.name || row.nome || row.panel_name || row.cnes}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">{row.email || row.cnes || row.last_path || 'Sem detalhes'}</span>
                  <span
                    className="inline-flex h-6 items-center rounded-full border px-2.5 text-xs"
                    style={{ backgroundColor: `${accent}18`, color: accent, borderColor: `${accent}44` }}
                  >
                    {formatSeenLabel(row)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-muted-foreground">{emptyLabel}</p>
      )}
    </BaseCard>
  );
}

export default function ConformidadesDashboard() {
  const { mode } = useContext(ColorModeContext);
  const isDarkMode = mode === 'dark';
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErro(null);

    api.get('/dashboard/conformidades')
      .then((res) => setDados(res.data))
      .catch((err) => setErro(err))
      .finally(() => setLoading(false));
  }, []);

  const chart = useMemo(() => {
    if (!dados) return null;

    const usuariosStatus = normalizeSeries(dados.usuarios_status || []);
    const painelStatus = normalizeSeries(dados.painel_status || []);
    const usuariosFaixas = normalizeSeries(dados.usuarios_faixas || []);
    const painelFaixas = normalizeSeries(dados.painel_faixas || []);
    const avisosDestino = normalizeSeries(dados.avisos_destino || []);

    return {
      usuariosStatusLabels: usuariosStatus.map((row) => row.label),
      usuariosStatusValores: usuariosStatus.map((row) => row.total),
      painelStatusLabels: painelStatus.map((row) => row.label),
      painelStatusValores: painelStatus.map((row) => row.total),
      usuariosFaixasLabels: usuariosFaixas.map((row) => row.label),
      usuariosFaixasValores: usuariosFaixas.map((row) => row.total),
      painelFaixasLabels: painelFaixas.map((row) => row.label),
      painelFaixasValores: painelFaixas.map((row) => row.total),
      avisosDestinoLabels: avisosDestino.map((row) => row.label),
      avisosDestinoValores: avisosDestino.map((row) => row.total),
    };
  }, [dados]);

  if (loading) return <LoadingState />;
  if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('Conformidades', erro)} />;

  const { totais } = dados;
  const chartFont = { fontFamily: "'DM Sans', sans-serif" };
  const toolbarOff = { toolbar: { show: false } };

  return (
    <div className="ui-reset">
      <Grade container spacing={3} mb={3}>
        <Grade item xs={12} sm={6} md={3}>
          <CardTotal icon="users" titulo="Usuários ativos" valor={totais.usuarios_total} cor={STATUS_STYLES.neutral} descricao="Base ativa do sistema" />
        </Grade>
        <Grade item xs={12} sm={6} md={3}>
          <CardTotal icon="check-circle" titulo="Usuários online" valor={totais.usuarios_online} cor={STATUS_STYLES.online} descricao="Atualização recente" />
        </Grade>
        <Grade item xs={12} sm={6} md={3}>
          <CardTotal icon="x-circle" titulo="Usuários offline" valor={totais.usuarios_offline} cor={STATUS_STYLES.offline} descricao="Sem presença recente" />
        </Grade>
        <Grade item xs={12} sm={6} md={3}>
          <CardTotal icon="monitor" titulo="Painéis CNES" valor={totais.painel_total} cor={STATUS_STYLES.neutral} descricao="Unidades do eSUS" />
        </Grade>
        <Grade item xs={12} sm={6} md={3}>
          <CardTotal icon="monitor" titulo="Painéis online" valor={totais.painel_online} cor={STATUS_STYLES.online} descricao="Acessos recentes" />
        </Grade>
        <Grade item xs={12} sm={6} md={3}>
          <CardTotal icon="shield" titulo="Painéis offline" valor={totais.painel_offline} cor={STATUS_STYLES.offline} descricao="Sem conexão recente" />
        </Grade>
        <Grade item xs={12} sm={6} md={3}>
          <CardTotal icon="bell" titulo="Avisos ativos" valor={totais.avisos_ativos} cor={STATUS_STYLES.notice} descricao="Dentro da validade" />
        </Grade>
        <Grade item xs={12} sm={6} md={3}>
          <CardTotal icon="clock" titulo="Avisos em 7 dias" valor={totais.avisos_expirando_7d} cor={STATUS_STYLES.notice} descricao="Próximos do vencimento" />
        </Grade>
      </Grade>

      <Grade container spacing={3}>
        <Grade item xs={12} md={4}>
          <BaseCard title="Usuários online x offline">
            <Chart
              type="donut"
              height={300}
              options={{
                chart: { ...chartFont, ...toolbarOff },
                labels: chart.usuariosStatusLabels,
                colors: [STATUS_STYLES.online, STATUS_STYLES.offline],
                legend: {
                  position: 'bottom',
                  labels: { colors: isDarkMode ? '#ffffff' : '#546e7a' },
                },
                plotOptions: { pie: { donut: { size: '68%' } } },
                dataLabels: { enabled: true },
                tooltip: { theme: 'dark' },
              }}
              series={chart.usuariosStatusValores}
            />
          </BaseCard>
        </Grade>

        <Grade item xs={12} md={4}>
          <BaseCard title="Painéis online x offline">
            <Chart
              type="donut"
              height={300}
              options={{
                chart: { ...chartFont, ...toolbarOff },
                labels: chart.painelStatusLabels,
                colors: [STATUS_STYLES.online, STATUS_STYLES.offline],
                legend: {
                  position: 'bottom',
                  labels: { colors: isDarkMode ? '#ffffff' : '#546e7a' },
                },
                plotOptions: { pie: { donut: { size: '68%' } } },
                dataLabels: { enabled: true },
                tooltip: { theme: 'dark' },
              }}
              series={chart.painelStatusValores}
            />
          </BaseCard>
        </Grade>

        <Grade item xs={12} md={4}>
          <BaseCard title="Avisos por destino">
            <Chart
              type="donut"
              height={300}
              options={{
                chart: { ...chartFont, ...toolbarOff },
                labels: chart.avisosDestinoLabels,
                colors: [STATUS_STYLES.neutral, STATUS_STYLES.notice],
                legend: {
                  position: 'bottom',
                  labels: { colors: isDarkMode ? '#ffffff' : '#546e7a' },
                },
                plotOptions: { pie: { donut: { size: '68%' } } },
                dataLabels: { enabled: true },
                tooltip: { theme: 'dark' },
              }}
              series={chart.avisosDestinoValores}
            />
          </BaseCard>
        </Grade>

        <Grade item xs={12} md={6}>
          <BaseCard title="Faixas de atualização dos usuários">
            <Chart
              type="bar"
              height={320}
              options={{
                chart: { ...chartFont, ...toolbarOff },
                plotOptions: { bar: { horizontal: true, borderRadius: 5 } },
                colors: [STATUS_STYLES.neutral],
                xaxis: {
                  categories: chart.usuariosFaixasLabels,
                  labels: { style: { colors: isDarkMode ? '#ffffff' : '#90a4ae' } },
                },
                yaxis: { labels: { style: { colors: isDarkMode ? '#ffffff' : '#90a4ae' } } },
                dataLabels: { enabled: false },
                tooltip: { theme: 'dark' },
                grid: { borderColor: 'transparent' },
              }}
              series={[{ name: 'Usuários', data: chart.usuariosFaixasValores }]}
            />
          </BaseCard>
        </Grade>

        <Grade item xs={12} md={6}>
          <BaseCard title="Faixas de atualização dos painéis">
            <Chart
              type="bar"
              height={320}
              options={{
                chart: { ...chartFont, ...toolbarOff },
                plotOptions: { bar: { horizontal: true, borderRadius: 5 } },
                colors: [STATUS_STYLES.notice],
                xaxis: {
                  categories: chart.painelFaixasLabels,
                  labels: { style: { colors: isDarkMode ? '#ffffff' : '#90a4ae' } },
                },
                yaxis: { labels: { style: { colors: isDarkMode ? '#ffffff' : '#90a4ae' } } },
                dataLabels: { enabled: false },
                tooltip: { theme: 'dark' },
                grid: { borderColor: 'transparent' },
              }}
              series={[{ name: 'Painéis', data: chart.painelFaixasValores }]}
            />
          </BaseCard>
        </Grade>

        <Grade item xs={12} md={6}>
          <RecentPresenceCard
            title="Últimos usuários com presença"
            rows={dados.recentes_usuarios || []}
            emptyLabel="Nenhum usuário com presença registrada."
            accent={STATUS_STYLES.neutral}
          />
        </Grade>

        <Grade item xs={12} md={6}>
          <RecentPresenceCard
            title="Últimos painéis com presença"
            rows={dados.recentes_paineis || []}
            emptyLabel="Nenhum painel com presença registrada."
            accent={STATUS_STYLES.notice}
          />
        </Grade>
      </Grade>
    </div>
  );
}
