import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  Grid,
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

const number = (value) => new Intl.NumberFormat("pt-BR").format(Number(value || 0));
const bytes = (value) => {
  const size = Number(value || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  return `${(size / 1024 ** 3).toFixed(2)} GB`;
};

function MetricCard({ icon, label, value, detail }) {
  return (
    <Card sx={{ height: "100%", p: 2.2, border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
        <FeatherIcon icon={icon} width="19" />
        <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 13 }}>{label}</Typography>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 800 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{detail}</Typography>
    </Card>
  );
}

export default function ArquivoDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/arquivo")
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(requestError?.response?.data?.message || "Não foi possível carregar o dashboard do arquivo.")
      );
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return (
    <Box className="dashboard-neon-home">
      <Grid container spacing={2}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid item xs={12} sm={6} lg={3} key={`metric-${index}`}>
            <Skeleton variant="rounded" height={126} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={320} sx={{ mt: 2 }} />
    </Box>
  );

  return (
    <Box className="dashboard-neon-home">
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}><MetricCard icon="archive" label="Documentos ativos" value={number(data.totais?.documentos)} detail={`${number(data.totais?.documentos_mes)} adicionados no mês`} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><MetricCard icon="copy" label="Versões armazenadas" value={number(data.totais?.versoes)} detail="Histórico de versões preservado" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><MetricCard icon="hard-drive" label="Espaço ocupado" value={bytes(data.totais?.tamanho_bytes)} detail="Soma dos arquivos de todas as versões" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><MetricCard icon="check-circle" label="Aprovações registradas" value={number(data.totais?.aprovacoes_registradas)} detail="Histórico formal de aprovação" /></Grid>
      </Grid>

      <Card sx={{ mt: 2, border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 800 }}>Documentos atualizados recentemente</Typography>
          <Typography variant="caption" color="text.secondary">Status, classificação de sigilo e versão atual.</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Documento</TableCell><TableCell>Tipo</TableCell><TableCell>Status</TableCell><TableCell>Sigilo</TableCell><TableCell align="right">Versão</TableCell><TableCell>Atualização</TableCell></TableRow></TableHead>
            <TableBody>
              {(data.recentes || []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.titulo}</TableCell>
                  <TableCell>{item.tipo || "-"}</TableCell>
                  <TableCell>{String(item.status || "-").replace(/_/g, " ")}</TableCell>
                  <TableCell>{String(item.sigilo || "-").replace(/_/g, " ")}</TableCell>
                  <TableCell align="right">{number(item.current_version_number)}</TableCell>
                  <TableCell>{item.updated_at ? new Intl.DateTimeFormat("pt-BR").format(new Date(item.updated_at)) : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
