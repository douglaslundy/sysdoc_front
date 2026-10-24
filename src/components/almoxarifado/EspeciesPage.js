import React, { useMemo } from 'react';
import { Pilula } from '../ui/pilula';
import CrudPage from './CrudPage';

export default function EspeciesPage() {
  const fields = useMemo(() => ([
    { name: 'nome', label: 'Nome', inputProps: { maxLength: 120 } },
    { name: 'observacoes', label: 'Observações', multiline: true, rows: 3 },
    { name: 'ativo', label: 'Espécie ativa', type: 'switch', defaultValue: true },
  ]), []);

  const columns = useMemo(() => ([
    { key: 'nome', label: 'Espécie', render: (row) => <span className="font-semibold">{row.nome}</span> },
    { key: 'status', label: 'Status', render: (row) => <Pilula tom={row.ativo ? 'sucesso' : 'perigo'}>{row.ativo ? 'Ativa' : 'Inativa'}</Pilula> },
  ]), []);

  return (
    <CrudPage
      title="Espécies"
      subtitle="Espécies ou tipos de produtos."
      apiPath="/almoxarifado/catalogos/especies"
      fields={fields}
      columns={columns}
      perPageOptions={[10, 15, 25]}
    />
  );
}
