import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const KPI = ({ label, value }) => (
  <Card>
    <CardContent>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default function RelatoriosPage() {
  const [kpi, setKpi] = useState({ produtos: 0, estoques: 0, requisicoes: 0, pendentes: 0 });

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/almoxarifado/produtos', { params: { per_page: 1, page: 1 } }),
      api.get('/almoxarifado/estoque', { params: { per_page: 1, page: 1 } }),
      api.get('/almoxarifado/requisicoes', { params: { per_page: 1, page: 1 } }),
      api.get('/almoxarifado/requisicoes', { params: { per_page: 1, page: 1, status: 'recebida' } }),
    ]).then(([produtos, estoque, requisicoes, pendentes]) => {
      if (!mounted) return;
      setKpi({
        produtos: Number(produtos.data?.total ?? 0),
        estoques: Number(estoque.data?.total ?? 0),
        requisicoes: Number(requisicoes.data?.total ?? 0),
        pendentes: Number(pendentes.data?.total ?? 0),
      });
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <Box sx={modalFormRootSx} className="queue-page almoxarifado-relatorios-page">
      <BaseCard title="Relatórios">
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Resumo inicial do almoxarifado. Na próxima iteração vou expandir para filtros e gráficos dedicados.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><KPI label="Produtos" value={kpi.produtos} /></Grid>
          <Grid item xs={12} md={3}><KPI label="Saldos" value={kpi.estoques} /></Grid>
          <Grid item xs={12} md={3}><KPI label="Requisições" value={kpi.requisicoes} /></Grid>
          <Grid item xs={12} md={3}><KPI label="Pendentes" value={kpi.pendentes} /></Grid>
        </Grid>
      </BaseCard>
    </Box>
  );
}
