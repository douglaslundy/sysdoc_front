import React, { useMemo } from 'react';
import { Pilula } from '../ui/pilula';
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
    { key: 'nome', label: 'Fornecedor', render: (row) => <span className="font-semibold">{row.nome}</span> },
    { key: 'documento', label: 'Documento' },
    { key: 'contato', label: 'Contato' },
    { key: 'status', label: 'Status', render: (row) => <Pilula tom={row.ativo ? 'sucesso' : 'perigo'}>{row.ativo ? 'Ativo' : 'Inativo'}</Pilula> },
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
