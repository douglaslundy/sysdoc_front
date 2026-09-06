import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  Grid,
  LinearProgress,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
import { api } from "../../services/api";

const number = (value) =>
  new Intl.NumberFormat("pt-BR").format(Number(value || 0));

const bytes = (value) => {
  const size = Number(value || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  return `${(size / 1024 ** 3).toFixed(1)} GB`;
};

function MetricCard({ icon, label, value, detail }) {
  return (
    <Card
      className="dashboard-neon-kpi"
      sx={{
        height: "100%",
        p: 2.2,
        border: "1px solid var(--lg-border)",
        background: "var(--lg-glass-panel)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
        <FeatherIcon icon={icon} width="19" />
        <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 13 }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 800 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {detail}
      </Typography>
    </Card>
  );
}

export default function ChatDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/chat")
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(
          requestError?.response?.data?.message ||
            "Não foi possível carregar o dashboard do chat."
        )
      );
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) {
    return (
      <Box>
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={12} sm={6} lg={3} key={`metric-${index}`}>
              <Skeleton variant="rounded" height={126} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2} sx={{ mt: 0.2 }}>
          {Array.from({ length: 2 }).map((_, index) => (
            <Grid item xs={12} md={6} key={`progress-${index}`}>
              <Skeleton variant="rounded" height={150} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2} sx={{ mt: 0.2 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={6} md={3} key={`small-${index}`}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const dailyEvents = Number(data.today?.events_published || 0);
  const isSoketi = data.limits?.engine === "soketi";
  const eventLimit = data.limits?.daily_messages
    ? Number(data.limits.daily_messages)
    : null;
  const connectionLimit = data.limits?.concurrent_connections
    ? Number(data.limits.concurrent_connections)
    : null;
  const currentConnections = Number(data.current?.connections || 0);
  const dailyPercent = eventLimit
    ? Math.min(100, (dailyEvents / eventLimit) * 100)
    : 0;
  const connectionPercent = connectionLimit
    ? Math.min(100, (currentConnections / connectionLimit) * 100)
    : 0;

  return (
    <Box className="dashboard-neon-home">
      <Alert severity="info" sx={{ mb: 2 }}>
        {isSoketi
          ? "O SysDoc está monitorando o uso do servidor Soketi. Os limites dependem da capacidade do servidor onde ele está hospedado."
          : "O sistema registra publicações e conexões do chat. No Pusher, uma publicação entregue a vários usuários pode consumir mais de uma mensagem; confirme o valor faturável no painel do provedor."}
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard icon="message-circle" label="Mensagens hoje" value={number(data.today?.messages_sent)} detail={`${number(data.month?.messages_sent)} no mes`} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard icon="radio" label="Eventos publicados hoje" value={number(dailyEvents)} detail={`${number(data.month?.events_published)} no mes`} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard icon="users" label="Conexões atuais" value={number(currentConnections)} detail={`${number(data.today?.peak_connections)} pico hoje`} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard icon="paperclip" label="Anexos no mes" value={number(data.month?.attachments_sent)} detail={bytes(data.month?.attachment_bytes)} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.2 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2.2, height: "100%", border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Consumo diário do plano</Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
              <Typography variant="body2">{number(dailyEvents)} eventos registrados</Typography>
              <Typography variant="body2">{dailyPercent.toFixed(2)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={dailyPercent} color={dailyPercent >= 80 ? "warning" : "primary"} sx={{ height: 9, borderRadius: 5 }} />
            <Typography variant="caption" color="text.secondary">
              {eventLimit
                ? `Referência: ${number(eventLimit)} mensagens por dia no ${data.limits?.plan}.`
                : "Sem limite fixo configurado pelo provedor. Acompanhe a capacidade do servidor Soketi."}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2.2, height: "100%", border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Conexões simultâneas</Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
              <Typography variant="body2">{number(currentConnections)} conexões</Typography>
              <Typography variant="body2">{connectionPercent.toFixed(1)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={connectionPercent} color={connectionPercent >= 80 ? "warning" : "success"} sx={{ height: 9, borderRadius: 5 }} />
            <Typography variant="caption" color="text.secondary">
              {connectionLimit
                ? `Limite de ${number(connectionLimit)} conexões simultâneas.`
                : "Sem limite fixo configurado. O teto depende dos recursos do servidor Soketi."}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 2, border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 800 }}>Histórico dos últimos 30 dias</Typography>
          <Typography variant="caption" color="text.secondary">
            Mensagens, eventos, pico de conexões, anexos e falhas registrados pelo SysDoc.
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell align="right">Mensagens</TableCell>
                <TableCell align="right">Eventos</TableCell>
                <TableCell align="right">Pico de conexões</TableCell>
                <TableCell align="right">Anexos</TableCell>
                <TableCell align="right">Falhas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data.daily || []).map((item) => (
                <TableRow key={item.usage_date}>
                  <TableCell>
                    {new Intl.DateTimeFormat("pt-BR").format(new Date(`${String(item.usage_date).slice(0, 10)}T12:00:00`))}
                  </TableCell>
                  <TableCell align="right">{number(item.messages_sent)}</TableCell>
                  <TableCell align="right">{number(item.events_published)}</TableCell>
                  <TableCell align="right">{number(item.peak_connections)}</TableCell>
                  <TableCell align="right">{number(item.attachments_sent)}</TableCell>
                  <TableCell align="right">{number(item.failed_events)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Grid container spacing={2} sx={{ mt: 0.2 }}>
        <Grid item xs={6} md={3}>
          <MetricCard icon="layers" label="Conversas" value={number(data.totals?.conversations)} detail="Total persistido" />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard icon="mail" label="Mensagens" value={number(data.totals?.messages)} detail={`${number(data.current?.unread_messages)} não lidas`} />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard icon="file" label="Arquivos" value={number(data.totals?.attachments)} detail={bytes(data.totals?.storage_bytes)} />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard icon="user-check" label="Usuários online" value={number(data.current?.online_users)} detail={`${number(data.month?.connection_events)} eventos de presença no mês`} />
        </Grid>
      </Grid>
    </Box>
  );
}
