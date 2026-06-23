import React, { useEffect, useMemo, useState } from 'react';
import { Chip, Typography } from '@mui/material';
import { api } from '../../services/api';
import CrudPage from './CrudPage';

const truncate = (value, max = 30) => {
  if (!value) return '-';
  const text = String(value);
  return text.length > max ? `${text.substring(0, max)}...` : text;
};

export default function ProdutosPage() {
  const [options, setOptions] = useState({
    categorias: [],
    especies: [],
    unidades: [],
    fornecedores: [],
    localizacoes: [],
  });

  useEffect(() => {
    let mounted = true;
    api.get('/almoxarifado/produtos/opcoes').then((res) => {
      if (!mounted) return;
      setOptions({
        categorias: res.data.categorias || [],
        especies: res.data.especies || [],
        unidades: res.data.unidades || [],
        fornecedores: res.data.fornecedores || [],
        localizacoes: res.data.localizacoes || [],
      });
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const fields = useMemo(() => ([
    { name: 'nome', label: 'Nome', inputProps: { maxLength: 150 } },
    { name: 'codigo_interno', label: 'Código interno', inputProps: { maxLength: 60 } },
    { name: 'descricao', label: 'Descrição', multiline: true, rows: 3 },
    { name: 'codigo_barras', label: 'Código de barras', inputProps: { maxLength: 80 } },
    { name: 'qr_code', label: 'QR Code', inputProps: { maxLength: 255 } },
    {
      name: 'almoxarifado_categoria_id',
      label: 'Categoria',
      type: 'select',
      options: options.categorias.map((item) => ({ value: item.id, label: item.nome })),
    },
    {
      name: 'almoxarifado_especie_id',
      label: 'Espécie',
      type: 'select',
      options: options.especies.map((item) => ({ value: item.id, label: item.nome })),
    },
    {
      name: 'almoxarifado_unidade_medida_id',
      label: 'Unidade de medida',
      type: 'select',
      options: options.unidades.map((item) => ({ value: item.id, label: item.sigla ? `${item.nome} (${item.sigla})` : item.nome })),
    },
    {
      name: 'almoxarifado_fornecedor_id',
      label: 'Fornecedor',
      type: 'select',
      options: options.fornecedores.map((item) => ({ value: item.id, label: item.nome })),
    },
    {
      name: 'almoxarifado_localizacao_id',
      label: 'Localização',
      type: 'select',
      options: options.localizacoes.map((item) => ({ value: item.id, label: item.nome })),
    },
    { name: 'marca', label: 'Marca', inputProps: { maxLength: 120 } },
    { name: 'modelo', label: 'Modelo', inputProps: { maxLength: 120 } },
    { name: 'fabricante', label: 'Fabricante', inputProps: { maxLength: 120 } },
    { name: 'numero_serie', label: 'Número de série', inputProps: { maxLength: 120 } },
    { name: 'lote', label: 'Lote', inputProps: { maxLength: 80 } },
    { name: 'validade', label: 'Validade', type: 'date' },
    { name: 'estoque_minimo', label: 'Estoque mínimo', type: 'number' },
    { name: 'estoque_maximo', label: 'Estoque máximo', type: 'number' },
    { name: 'almoxarifado', label: 'Almoxarifado', inputProps: { maxLength: 120 } },
    { name: 'sala', label: 'Sala', inputProps: { maxLength: 80 } },
    { name: 'corredor', label: 'Corredor', inputProps: { maxLength: 80 } },
    { name: 'estante', label: 'Estante', inputProps: { maxLength: 80 } },
    { name: 'prateleira', label: 'Prateleira', inputProps: { maxLength: 80 } },
    { name: 'gaveta', label: 'Gaveta', inputProps: { maxLength: 80 } },
    { name: 'caixa', label: 'Caixa', inputProps: { maxLength: 80 } },
    { name: 'posicao', label: 'Posição', inputProps: { maxLength: 80 } },
    { name: 'observacao_localizacao', label: 'Observação de localização', multiline: true, rows: 2 },
    { name: 'imagem_url', label: 'Imagem / anexo', inputProps: { maxLength: 255 } },
    { name: 'observacoes', label: 'Observações', multiline: true, rows: 2 },
    { name: 'ativo', label: 'Produto ativo', type: 'switch', defaultValue: true },
  ]), [options]);

  const columns = useMemo(() => ([
    { key: 'nome', label: 'Produto', render: (row) => <Typography variant="h6" sx={{ fontWeight: 600 }}>{truncate(row.nome, 30)}</Typography> },
    { key: 'codigo_interno', label: 'Código interno' },
    { key: 'estoque', label: 'Estoque', render: (row) => (
      <Typography>
        {Number(row.quantidade_disponivel_total || 0).toFixed(3)}
      </Typography>
    ) },
    { key: 'disponibilidade', label: 'Disponível', render: (row) => (
      <Chip
        size="small"
        color={Number(row.quantidade_disponivel_total || 0) > 0 ? 'success' : 'error'}
        label={Number(row.quantidade_disponivel_total || 0) > 0 ? 'Disponível' : 'Indisponível'}
      />
    ) },
    { key: 'categoria', label: 'Categoria', render: (row) => row.categoria?.nome || '-' },
    { key: 'unidade', label: 'Unidade', render: (row) => row.unidade ? `${row.unidade.nome}${row.unidade.sigla ? ` (${row.unidade.sigla})` : ''}` : '-' },
  ]), []);

  return (
    <CrudPage
      title="Produtos"
      subtitle="Consulta e cadastro de itens do almoxarifado."
      apiPath="/almoxarifado/produtos"
      fields={fields}
      columns={columns}
      perPageOptions={[15, 50, 100]}
    />
  );
}
