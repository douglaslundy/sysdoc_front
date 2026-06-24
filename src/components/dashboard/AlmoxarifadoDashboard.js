import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Grid,
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
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(value || 0));

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

export default function AlmoxarifadoDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/almoxarifado")
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(requestError?.response?.data?.message || "Não foi possível carregar o dashboard do almoxarifado.")
      );
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}><CircularProgress /></Box>;

  return (
    <Box className="dashboard-neon-home">
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}><MetricCard icon="package" label="Produtos ativos" value={number(data.totais?.produtos)} detail="Itens cadastrados no almoxarifado" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><MetricCard icon="layers" label="Saldo disponível" value={number(data.totais?.quantidade_disponivel)} detail="Soma das quantidades disponíveis" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><MetricCard icon="alert-triangle" label="Estoque abaixo do mínimo" value={number(data.totais?.estoque_baixo)} detail="Itens que exigem reposição" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><MetricCard icon="clipboard" label="Requisições pendentes" value={number(data.totais?.requisicoes_pendentes)} detail={`${number(data.totais?.movimentacoes_mes)} movimentações no mês`} /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.2 }}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: "100%", border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
            <Box sx={{ p: 2 }}><Typography sx={{ fontWeight: 800 }}>Itens com estoque baixo</Typography></Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Produto</TableCell><TableCell>Código</TableCell><TableCell align="right">Disponível</TableCell><TableCell align="right">Mínimo</TableCell></TableRow></TableHead>
                <TableBody>
                  {(data.estoque_baixo || []).map((item) => (
                    <TableRow key={`${item.codigo_interno}-${item.nome}`}>
                      <TableCell>{item.nome}</TableCell>
                      <TableCell>{item.codigo_interno || "-"}</TableCell>
                      <TableCell align="right">{number(item.quantidade_disponivel)}</TableCell>
                      <TableCell align="right">{number(item.estoque_minimo)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: "100%", border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
            <Box sx={{ p: 2 }}><Typography sx={{ fontWeight: 800 }}>Movimentações recentes</Typography></Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Produto</TableCell><TableCell>Tipo</TableCell><TableCell align="right">Quantidade</TableCell><TableCell>Data</TableCell></TableRow></TableHead>
                <TableBody>
                  {(data.movimentacoes_recentes || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.produto}</TableCell>
                      <TableCell>{String(item.tipo || "-").replace(/_/g, " ")}</TableCell>
                      <TableCell align="right">{number(item.quantidade)}</TableCell>
                      <TableCell>{item.created_at ? new Intl.DateTimeFormat("pt-BR").format(new Date(item.created_at)) : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
