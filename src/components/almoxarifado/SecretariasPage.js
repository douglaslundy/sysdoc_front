import React, { useMemo } from 'react';
import { Chip, Typography } from '@mui/material';
import CrudPage from './CrudPage';

export default function SecretariasPage() {
  const fields = useMemo(() => ([
    { name: 'nome', label: 'Nome', inputProps: { maxLength: 120 } },
    { name: 'sigla', label: 'Sigla', inputProps: { maxLength: 20 } },
    { name: 'responsavel', label: 'Responsável', inputProps: { maxLength: 120 } },
    { name: 'contato', label: 'Contato', inputProps: { maxLength: 120 } },
    { name: 'observacoes', label: 'Observações', multiline: true, rows: 3 },
    { name: 'ativo', label: 'Secretaria ativa', type: 'switch', defaultValue: true },
  ]), []);

  const columns = useMemo(() => ([
    { key: 'nome', label: 'Secretaria', render: (row) => <Typography variant="h6" sx={{ fontWeight: 600 }}>{row.nome}</Typography> },
    { key: 'sigla', label: 'Sigla' },
    { key: 'responsavel', label: 'Responsável' },
    { key: 'contato', label: 'Contato' },
    { key: 'status', label: 'Status', render: (row) => <Chip size="small" color={row.ativo ? 'success' : 'error'} label={row.ativo ? 'Ativa' : 'Inativa'} /> },
  ]), []);

  return (
    <CrudPage
      title="Secretarias"
      subtitle="Cadastro das secretarias atendidas pelo almoxarifado."
      apiPath="/almoxarifado/catalogos/secretarias"
      fields={fields}
      columns={columns}
      perPageOptions={[10, 15, 25]}
    />
  );
}
