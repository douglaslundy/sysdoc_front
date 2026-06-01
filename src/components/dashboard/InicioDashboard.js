import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, CircularProgress, Button } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { DashboardErro, getDashboardErrorMessage } from './DashboardStatus';

const KPI_STYLES = {
  blue: {
    iconColor: '#93c5fd',
    border: '1px solid rgba(37, 99, 235, 0.75)',
    shadow: '0 18px 45px rgba(0,0,0,0.28), 0 0 24px rgba(37,99,235,0.24), inset 0 0 28px rgba(37,99,235,0.06)',
    iconBg: 'rgba(37, 99, 235, 0.16)',
    iconShadow: '0 0 28px rgba(37,99,235,0.22), inset 0 0 24px rgba(37,99,235,0.10)',
  },
  orange: {
    iconColor: '#fcd34d',
    border: '1px solid rgba(245, 158, 11, 0.55)',
    shadow: '0 18px 45px rgba(0,0,0,0.28), 0 0 24px rgba(245,158,11,0.18), inset 0 0 28px rgba(245,158,11,0.05)',
    iconBg: 'rgba(245, 158, 11, 0.16)',
    iconShadow: '0 0 28px rgba(245,158,11,0.20), inset 0 0 24px rgba(245,158,11,0.09)',
  },
  purple: {
    iconColor: '#d8b4fe',
    border: '1px solid rgba(147, 51, 234, 0.70)',
    shadow: '0 18px 45px rgba(0,0,0,0.28), 0 0 24px rgba(147,51,234,0.22), inset 0 0 28px rgba(147,51,234,0.06)',
    iconBg: 'rgba(147, 51, 234, 0.16)',
    iconShadow: '0 0 28px rgba(147,51,234,0.22), inset 0 0 24px rgba(147,51,234,0.10)',
  },
  cyan: {
    iconColor: '#67e8f9',
    border: '1px solid rgba(6, 182, 212, 0.70)',
    shadow: '0 18px 45px rgba(0,0,0,0.28), 0 0 24px rgba(6,182,212,0.22), inset 0 0 28px rgba(6,182,212,0.06)',
    iconBg: 'rgba(6, 182, 212, 0.16)',
    iconShadow: '0 0 28px rgba(6,182,212,0.22), inset 0 0 24px rgba(6,182,212,0.10)',
  },
};

function CardTotal({ icon, titulo, valor, variant }) {
  const s = KPI_STYLES[variant] || KPI_STYLES.blue;
  return (
    <Card sx={{ height: '100%', border: s.border, boxShadow: s.shadow }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" variant="subtitle1">{titulo}</Typography>
            <Typography variant="h3" fontWeight="bold" mt={0.5}>{valor ?? '—'}</Typography>
            <Typography color="textSecondary" variant="body1" mt={1}>Total cadastrados</Typography>
          </Box>
          <Box sx={{
            width: 82,
            height: 82,
            borderRadius: '50%',
            background: s.iconBg,
            boxShadow: s.iconShadow,
            display: 'grid',
            placeItems: 'center',
          }}>
            <FeatherIcon icon={icon} color={s.iconColor} width="32" height="32" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function gerarMeses(mapa) {
  const meses = [];
  const valores = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    meses.push(label.toUpperCase());
    valores.push(mapa[chave] || 0);
  }
  return { meses, valores };
}

export default function InicioDashboard() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get('/dashboard/inicio')
      .then((res) => setDados(res.data))
      .catch((err) => setErro(err))
      .finally(() => setLoading(false));
  }, []);

  const chart = useMemo(() => {
    if (!dados) return null;
    return { clientes: gerarMeses(dados.clientes_por_mes || {}) };
  }, [dados]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('Inicio', erro)} />;

  const { totais } = dados;
  const chartFont = { fontFamily: "'DM Sans', sans-serif" };

  return (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}><CardTotal icon="users" titulo="Clientes" valor={totais.clientes} variant="blue" /></Grid>
        <Grid item xs={12} sm={6} md={3}><CardTotal icon="file-text" titulo="Ofícios" valor={totais.oficios} variant="orange" /></Grid>
        <Grid item xs={12} sm={6} md={3}><CardTotal icon="book" titulo="Portarias" valor={totais.portarias} variant="purple" /></Grid>
        <Grid item xs={12} sm={6} md={3}><CardTotal icon="cpu" titulo="Modelos IA" valor={totais.modelos_ia} variant="cyan" /></Grid>
      </Grid>

      <BaseCard title="Clientes Cadastrados por Mês (últimos 12 meses)">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button variant="outlined" size="small">Últimos 12 meses</Button>
        </Box>
        <Chart
          type="area"
          height={420}
          options={{
            chart: { ...chartFont, toolbar: { show: false } },
            colors: ['#2563eb'],
            xaxis: { categories: chart.clientes.meses, labels: { style: { colors: '#93a7c7', fontSize: '12px' } } },
            yaxis: { labels: { style: { colors: '#93a7c7' } } },
            fill: {
              type: 'gradient',
              gradient: {
                type: 'vertical',
                shadeIntensity: 1,
                gradientToColors: ['#2563eb'],
                opacityFrom: 0.55,
                opacityTo: 0.04,
                stops: [0, 100],
              },
            },
            stroke: { curve: 'smooth', width: 3 },
            markers: { size: 4, colors: ['#fff'], strokeColors: '#2563eb', strokeWidth: 2 },
            dataLabels: { enabled: false },
            tooltip: { theme: 'dark' },
            grid: { borderColor: 'rgba(148,163,184,0.13)', strokeDashArray: 6 },
          }}
          series={[{ name: 'Clientes', data: chart.clientes.valores }]}
        />
      </BaseCard>
    </Box>
  );
}
