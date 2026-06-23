import React from 'react';
import { Box, Typography } from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

export default function ConfiguracoesPage() {
  return (
    <Box sx={modalFormRootSx} className="queue-page almoxarifado-configuracoes-page">
      <BaseCard title="Configurações do Almoxarifado">
        <Typography color="text.secondary">
          Nesta etapa, o módulo já está pronto para receber regras específicas de reserva, inventário e impressão.
        </Typography>
      </BaseCard>
    </Box>
  );
}
