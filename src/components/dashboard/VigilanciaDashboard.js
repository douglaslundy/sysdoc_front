import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, CircularProgress, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FeatherIcon from 'feather-icons-react';
import { normalizeIconName } from '../../utils/iconResolver';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { DashboardErro, getDashboardErrorMÃªssage } from './DashboardStatus';

const RISCO_COR = { '1': '#4caf50', '2': '#ff9800', '3': '#f44336', 'N/A': '#607d8b' };
const RISCO_ORDEM = ['1', '2', '3', 'N/A'];

function normalizarRisco(valor) {
  const v = String(valor ?? '').trim().toUpperCase();
  if (v === '1' || v === '2' || v === '3') return v;
  if (v === 'N/A' || v === 'NA') return 'N/A';
  return 'N/A';
}

function CardTotal({ icon, titulo, valor, cor, iconBoxWidth = 60 }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ px: 2.5, py: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-secondary)', fontWeight: 600, lineHeight: 1.25 }}>{titulo}</Typography>
            <Typography variant="h3" fontWeight="bold" mt={0.5}>{valor ?? 'Ã¢â‚¬â€'}</Typography>
          </Box>
          <Box
            sx={{
              minWidth: iconBoxWidth,
              width: iconBoxWidth,
              height: iconBoxWidth,
              borderRadius: '50%',
              bgcolor: cor + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FeatherIcon icon={normalizeIconName(icon, 'circle')} color={cor} width="26" height="26" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function gerarMÃªsesFromMap(mapa) {
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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
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

    const porMÃªs = gerarMÃªsesFromMap(dados.por_mes || {});
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

    return { porMÃªs, statusLabels, statusValues, riscoLabels, riscoValues, riscoCores, proximos };
  }, [dados]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMÃªssage('Vigilancia Sanitaria', erro)} />;

  const { totais } = dados;
  const chartFont = { fontFamily: "'DM Sans', sans-serif" };
  const toolbarOff = { toolbar: { show: false } };

  const formatDate = (s) => {
    if (!s) return 'Ã¢â‚¬â€';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} sm={4} md={2}>
          <CardTotal icon="home" titulo="Estabelecimentos" valor={totais.estabelecimentos} cor="#2196f3" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <CardTotal icon="shield" titulo="AlvarÃ¡s" valor={totais.alvaras} cor="#607d8b" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <CardTotal icon="check-circle" titulo="Vigentes" valor={totais.vigentes} cor="#4caf50" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <CardTotal icon="alert-circle" titulo="Vencidos" valor={totais.vencidos} cor="#f44336" />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <CardTotal icon="alert-triangle" titulo="Vencem em 30d" valor={totais.vencendo_em_30} cor="#ff5722" />
        </Grid>
      </Grid>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          minHeight: { xs: 'auto', md: 'calc(100vh - 320px)' },
          mb: 3,
          '& .vigi-fill-card .card': {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            m: '0 !important',
            width: '100%',
          },
          '& .vigi-fill-card .card__content': {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          },
          '& .vigi-fill-card.risk .card__content': {
            justifyContent: 'center',
          },
        }}
      >
        <Box className="vigi-fill-card">
          <BaseCard title="AlvarÃ¡s por Status">
            {chart.statusLabels.length > 0 ? (
              <Chart
                type="bar"
                height="100%"
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
                series={[{ name: 'AlvarÃ¡s', data: chart.statusValues }]}
              />
            ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
          </BaseCard>
        </Box>

        <Box className="vigi-fill-card risk">
          <BaseCard title="Por NÃ­vel de Risco">
            {chart.riscoLabels.length > 0 ? (
              <Chart
                type="donut"
                height="100%"
                options={{
                  chart: { ...chartFont },
                  labels: chart.riscoLabels,
                  colors: chart.riscoCores,
                  legend: { labels: { colors: isDarkMode ? '#ffffff' : '#546e7a' } },
                  dataLabels: { enabled: true },
                  tooltip: { theme: 'dark' },
                }}
                series={chart.riscoValues}
              />
            ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
          </BaseCard>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <BaseCard title="AlvarÃ¡s Emitidos por MÃªs (Ãºltimos 12 meses)">
            <Chart
              type="area"
              height={300}
              options={{
                chart: { ...chartFont, ...toolbarOff },
                colors: ['#4caf50'],
                xaxis: {
                  categories: chart.porMÃªs.meses,
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
              series={[{ name: 'AlvarÃ¡s', data: chart.porMÃªs.valores }]}
            />
          </BaseCard>
        </Grid>

        {chart.proximos.length > 0 && (
          <Grid item xs={12}>
            <BaseCard title="PrÃ³ximos Vencimentos">
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['NÃºmero', 'Estabelecimento', 'Risco', 'Status', 'Vencimento'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 12px', color: '#90a4ae', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #2a3140' }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.proximos.map((alv) => (
                      <tr key={alv.id} style={{ borderBottom: '1px solid #1e2736' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{alv.numero_alvara}</td>
                        <td style={{ padding: '8px 12px' }}>{alv.estabelecimento?.nome_estabelecimento?.toUpperCase() ?? 'Ã¢â‚¬â€'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <Chip
                            label={`Risco ${normalizarRisco(alv.nivel_risco)}`}
                            size="small"
                            sx={{ bgcolor: (RISCO_COR[normalizarRisco(alv.nivel_risco)] || '#607d8b') + '33', color: RISCO_COR[normalizarRisco(alv.nivel_risco)] || '#607d8b' }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>{alv.status || 'Ã¢â‚¬â€'}</td>
                        <td style={{ padding: '8px 12px', color: '#ff9800', fontWeight: 600 }}>{formatDate(alv.vencimento_alvara)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </BaseCard>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
