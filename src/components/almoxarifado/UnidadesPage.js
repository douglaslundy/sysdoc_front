import React, { useMemo } from 'react';
import { Pilula } from '../ui/pilula';
import CrudPage from './CrudPage';

export default function UnidadesPage() {
  const fields = useMemo(() => ([
    { name: 'nome', label: 'Nome', inputProps: { maxLength: 80 } },
    { name: 'sigla', label: 'Sigla', inputProps: { maxLength: 20 } },
    { name: 'observacoes', label: 'Observações', multiline: true, rows: 3 },
    { name: 'ativo', label: 'Unidade ativa', type: 'switch', defaultValue: true },
  ]), []);

  const columns = useMemo(() => ([
    { key: 'nome', label: 'Unidade', render: (row) => <span className="font-semibold">{row.nome}</span> },
    { key: 'sigla', label: 'Sigla' },
    { key: 'status', label: 'Status', render: (row) => <Pilula tom={row.ativo ? 'sucesso' : 'perigo'}>{row.ativo ? 'Ativa' : 'Inativa'}</Pilula> },
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
