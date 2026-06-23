import React from 'react';
import NextLink from 'next/link';
import { Box, Button, Card, CardContent, Grid, Typography } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const AREAS = [
  { title: 'Produtos', href: '/almoxarifado/produtos', icon: 'archive', text: 'Cadastro e consulta de materiais.' },
  { title: 'Categorias', href: '/almoxarifado/categorias', icon: 'tag', text: 'Categorias dos produtos.' },
  { title: 'Espécies', href: '/almoxarifado/especies', icon: 'grid', text: 'Espécies e tipos de item.' },
  { title: 'Unidades', href: '/almoxarifado/unidades-medida', icon: 'maximize', text: 'Unidades de medida.' },
  { title: 'Fornecedores', href: '/almoxarifado/fornecedores', icon: 'truck', text: 'Cadastro de fornecedores.' },
  { title: 'Localizações', href: '/almoxarifado/localizacoes', icon: 'map-pin', text: 'Endereçamento físico.' },
  { title: 'Secretarias', href: '/almoxarifado/secretarias', icon: 'users', text: 'Unidades atendidas pelo estoque.' },
  { title: 'Estoque', href: '/almoxarifado/estoque', icon: 'layers', text: 'Saldo por produto e secretaria.' },
  { title: 'Requisições', href: '/almoxarifado/requisicoes', icon: 'clipboard', text: 'Solicitações, aprovações e entrega.' },
  { title: 'Movimentações', href: '/almoxarifado/movimentacoes', icon: 'refresh-cw', text: 'Entradas, saídas e transferências.' },
  { title: 'Relatórios', href: '/almoxarifado/relatorios', icon: 'bar-chart-2', text: 'Saldos, consumo e rastreabilidade.' },
  { title: 'Configurações', href: '/almoxarifado/configuracoes', icon: 'settings', text: 'Parâmetros do módulo.' },
];

export default function AlmoxarifadoHome() {
  return (
    <Box sx={modalFormRootSx} className="queue-page almoxarifado-page">
      <BaseCard title="Almoxarifado">
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Estrutura inicial do módulo de almoxarifado. As próximas etapas vão liberar os cadastros e fluxos operacionais.
        </Typography>

        <Grid container spacing={2}>
          {AREAS.map((area) => (
            <Grid item xs={12} sm={6} md={4} key={area.href}>
              <Card className="queue-page__module-card">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1.25} mb={1}>
                    <FeatherIcon icon={area.icon} width="18" height="18" />
                    <Typography variant="h6">{area.title}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 48 }}>
                    {area.text}
                  </Typography>
                  <NextLink href={area.href} passHref legacyBehavior>
                    <Button
                      component="a"
                      variant="contained"
                      sx={{ mt: 2 }}
                    >
                      Abrir
                    </Button>
                  </NextLink>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </BaseCard>
    </Box>
  );
}
