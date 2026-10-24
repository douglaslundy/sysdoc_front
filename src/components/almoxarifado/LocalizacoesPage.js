import React, { useMemo } from 'react';
import { Pilula } from '../ui/pilula';
import CrudPage from './CrudPage';

export default function LocalizacoesPage() {
  const fields = useMemo(() => ([
    { name: 'nome', label: 'Nome', inputProps: { maxLength: 150 } },
    { name: 'almoxarifado', label: 'Almoxarifado', inputProps: { maxLength: 120 } },
    { name: 'sala', label: 'Sala', inputProps: { maxLength: 80 } },
    { name: 'corredor', label: 'Corredor', inputProps: { maxLength: 80 } },
    { name: 'estante', label: 'Estante', inputProps: { maxLength: 80 } },
    { name: 'prateleira', label: 'Prateleira', inputProps: { maxLength: 80 } },
    { name: 'gaveta', label: 'Gaveta', inputProps: { maxLength: 80 } },
    { name: 'caixa', label: 'Caixa', inputProps: { maxLength: 80 } },
    { name: 'posicao', label: 'Posição', inputProps: { maxLength: 80 } },
    { name: 'observacoes', label: 'Observações', multiline: true, rows: 3 },
    { name: 'ativo', label: 'Localização ativa', type: 'switch', defaultValue: true },
  ]), []);

  const columns = useMemo(() => ([
    { key: 'nome', label: 'Localização', render: (row) => <span className="font-semibold">{row.nome}</span> },
    { key: 'almoxarifado', label: 'Almoxarifado' },
    { key: 'sala', label: 'Sala' },
    { key: 'status', label: 'Status', render: (row) => <Pilula tom={row.ativo ? 'sucesso' : 'perigo'}>{row.ativo ? 'Ativa' : 'Inativa'}</Pilula> },
  ]), []);

  return (
    <CrudPage
      title="Localizações"
      subtitle="Controle da localização física dos itens."
      apiPath="/almoxarifado/catalogos/localizacoes"
      fields={fields}
      columns={columns}
      perPageOptions={[10, 15, 25]}
    />
  );
}
