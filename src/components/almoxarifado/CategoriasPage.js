import React, { useMemo } from 'react';
import { Chip, Typography } from '@mui/material';
import CrudPage from './CrudPage';

export default function CategoriasPage() {
  const fields = useMemo(() => ([
    { name: 'nome', label: 'Nome', inputProps: { maxLength: 120 } },
    { name: 'observacoes', label: 'Observações', multiline: true, rows: 3 },
    { name: 'ativo', label: 'Categoria ativa', type: 'switch', defaultValue: true },
  ]), []);

  const columns = useMemo(() => ([
    { key: 'nome', label: 'Categoria', render: (row) => <Typography variant="h6" sx={{ fontWeight: 600 }}>{row.nome}</Typography> },
    { key: 'status', label: 'Status', render: (row) => <Chip size="small" color={row.ativo ? 'success' : 'error'} label={row.ativo ? 'Ativa' : 'Inativa'} /> },
  ]), []);

  return (
    <CrudPage
      title="Categorias"
      subtitle="Categorias de produtos do almoxarifado."
      apiPath="/almoxarifado/catalogos/categorias"
      fields={fields}
      columns={columns}
      perPageOptions={[10, 15, 25]}
    />
  );
}
