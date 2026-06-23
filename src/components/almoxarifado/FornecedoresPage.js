import React, { useMemo } from 'react';
import { Chip, Typography } from '@mui/material';
import CrudPage from './CrudPage';

export default function FornecedoresPage() {
  const fields = useMemo(() => ([
    { name: 'nome', label: 'Nome', inputProps: { maxLength: 150 } },
    { name: 'documento', label: 'Documento', inputProps: { maxLength: 30 } },
    { name: 'telefone', label: 'Telefone', inputProps: { maxLength: 30 } },
    { name: 'email', label: 'E-mail', inputProps: { maxLength: 120 } },
    { name: 'contato', label: 'Contato', inputProps: { maxLength: 120 } },
    { name: 'endereco', label: 'Endereço', inputProps: { maxLength: 255 } },
    { name: 'observacoes', label: 'Observações', multiline: true, rows: 3 },
    { name: 'ativo', label: 'Fornecedor ativo', type: 'switch', defaultValue: true },
  ]), []);

  const columns = useMemo(() => ([
    { key: 'nome', label: 'Fornecedor', render: (row) => <Typography variant="h6" sx={{ fontWeight: 600 }}>{row.nome}</Typography> },
    { key: 'documento', label: 'Documento' },
    { key: 'contato', label: 'Contato' },
    { key: 'status', label: 'Status', render: (row) => <Chip size="small" color={row.ativo ? 'success' : 'error'} label={row.ativo ? 'Ativo' : 'Inativo'} /> },
  ]), []);

  return (
    <CrudPage
      title="Fornecedores"
      subtitle="Fornecedores vinculados aos produtos."
      apiPath="/almoxarifado/catalogos/fornecedores"
      fields={fields}
      columns={columns}
      perPageOptions={[10, 15, 25]}
    />
  );
}
