import React, { useMemo } from 'react';
import { Pilula } from '../ui/pilula';
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
    { key: 'nome', label: 'Secretaria', render: (row) => <span className="font-semibold">{row.nome}</span> },
    { key: 'sigla', label: 'Sigla' },
    { key: 'responsavel', label: 'Responsável' },
    { key: 'contato', label: 'Contato' },
    { key: 'status', label: 'Status', render: (row) => <Pilula tom={row.ativo ? 'sucesso' : 'perigo'}>{row.ativo ? 'Ativa' : 'Inativa'}</Pilula> },
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
