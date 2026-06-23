import React, { useMemo } from 'react';
import { Chip, Typography } from '@mui/material';
import CrudPage from './CrudPage';

export default function UnidadesPage() {
  const fields = useMemo(() => ([
    { name: 'nome', label: 'Nome', inputProps: { maxLength: 80 } },
    { name: 'sigla', label: 'Sigla', inputProps: { maxLength: 20 } },
    { name: 'observacoes', label: 'Observações', multiline: true, rows: 3 },
    { name: 'ativo', label: 'Unidade ativa', type: 'switch', defaultValue: true },
  ]), []);

  const columns = useMemo(() => ([
    { key: 'nome', label: 'Unidade', render: (row) => <Typography variant="h6" sx={{ fontWeight: 600 }}>{row.nome}</Typography> },
    { key: 'sigla', label: 'Sigla' },
    { key: 'status', label: 'Status', render: (row) => <Chip size="small" color={row.ativo ? 'success' : 'error'} label={row.ativo ? 'Ativa' : 'Inativa'} /> },
  ]), []);

  return (
    <CrudPage
      title="Unidades de Medida"
      subtitle="Unidades usadas nos itens do almoxarifado."
      apiPath="/almoxarifado/catalogos/unidades-medida"
      fields={fields}
      columns={columns}
      perPageOptions={[10, 15, 25]}
    />
  );
}
