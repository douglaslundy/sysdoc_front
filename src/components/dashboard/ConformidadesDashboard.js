import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FeatherIcon from 'feather-icons-react';
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

function CardTotal({ icon, titulo, valor, cor, descricao }) {
  return (
    <Card className="dashboard-neon-kpi" sx={{ height: '100%', borderColor: `${cor}aa` }}>
      <CardContent sx={{ height: '100%' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 600 }}>{titulo}</Typography>
            <Typography variant="h3" fontWeight="bold" mt={0.5}>{valor ?? '—'}</Typography>
            {descricao ? (
              <Typography color="textSecondary" variant="body2" mt={0.5}>
                {descricao}
              </Typography>
            ) : null}
          </Box>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: `${cor}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FeatherIcon icon={icon} color={cor} width="28" height="28" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <Box className="dashboard-neon-home">
      <Grid container spacing={3}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Skeleton variant="rounded" height={126} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3} mt={0.5}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Grid item xs={12} md={4} key={`chart-${index}`}>
            <Skeleton variant="rounded" height={360} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3} mt={0.5}>
        {Array.from({ length: 2 }).map((_, index) => (
          <Grid item xs={12} md={6} key={`list-${index}`}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
        ))}
      </Grid>
    </Box>
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
        <List disablePadding>
          {rows.map((row, index) => (
            <React.Fragment key={`${row.id || row.cnes || index}`}>
              {index > 0 ? <Divider component="li" sx={{ borderColor: 'var(--lg-border-row)' }} /> : null}
              <ListItem
                disableGutters
                sx={{
                  py: 1.2,
                  px: 0,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    mt: '6px',
                    borderRadius: '50%',
                    bgcolor: row.is_online ? STATUS_STYLES.online : STATUS_STYLES.offline,
                    boxShadow: `0 0 14px ${row.is_online ? 'rgba(76,175,80,0.45)' : 'rgba(239,83,80,0.45)'}`,
                    flexShrink: 0,
                  }}
                />
                <ListItemText
                  primary={row.name || row.nome || row.panel_name || row.cnes}
                  secondary={
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mt={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {row.email || row.cnes || row.last_path || 'Sem detalhes'}
                      </Typography>
                      <Chip
                        size="small"
                        label={formatSeenLabel(row)}
                        sx={{
                          bgcolor: `${accent}18`,
                          color: accent,
                          border: `1px solid ${accent}44`,
                          height: 24,
                        }}
                      />
                    </Box>
                  }
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary" textAlign="center" py={3}>
          {emptyLabel}
        </Typography>
      )}
    </BaseCard>
  );
}

export default function ConformidadesDashboard() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
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
    <Box className="dashboard-neon-home">
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <CardTotal icon="users" titulo="Usuários ativos" valor={totais.usuarios_total} cor={STATUS_STYLES.neutral} descricao="Base ativa do sistema" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardTotal icon="check-circle" titulo="Usuários online" valor={totais.usuarios_online} cor={STATUS_STYLES.online} descricao="Atualização recente" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardTotal icon="x-circle" titulo="Usuários offline" valor={totais.usuarios_offline} cor={STATUS_STYLES.offline} descricao="Sem presença recente" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardTotal icon="monitor" titulo="Painéis CNES" valor={totais.painel_total} cor={STATUS_STYLES.neutral} descricao="Unidades do eSUS" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardTotal icon="monitor" titulo="Painéis online" valor={totais.painel_online} cor={STATUS_STYLES.online} descricao="Acessos recentes" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardTotal icon="shield" titulo="Painéis offline" valor={totais.painel_offline} cor={STATUS_STYLES.offline} descricao="Sem conexão recente" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardTotal icon="bell" titulo="Avisos ativos" valor={totais.avisos_ativos} cor={STATUS_STYLES.notice} descricao="Dentro da validade" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardTotal icon="clock" titulo="Avisos em 7 dias" valor={totais.avisos_expirando_7d} cor={STATUS_STYLES.notice} descricao="Próximos do vencimento" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
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
        </Grid>

        <Grid item xs={12} md={4}>
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
        </Grid>

        <Grid item xs={12} md={4}>
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
        </Grid>

        <Grid item xs={12} md={6}>
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
        </Grid>

        <Grid item xs={12} md={6}>
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
        </Grid>

        <Grid item xs={12} md={6}>
          <RecentPresenceCard
            title="Últimos usuários com presença"
            rows={dados.recentes_usuarios || []}
            emptyLabel="Nenhum usuário com presença registrada."
            accent={STATUS_STYLES.neutral}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <RecentPresenceCard
            title="Últimos painéis com presença"
            rows={dados.recentes_paineis || []}
            emptyLabel="Nenhum painel com presença registrada."
            accent={STATUS_STYLES.notice}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
