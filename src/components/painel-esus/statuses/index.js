import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { CabecalhoDePagina } from '../../ui/cabecalho-de-pagina';
import { CampoSelecao } from '../../ui/campos';
import { DataTable } from '../../ui/data-table';
import { Pilula } from '../../ui/pilula';

const formatRelativeTime = (value) => {
  if (!value) return 'Sem atualização';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Sem atualização';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60)));
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays} dias`;
};

const colunas = [
  { chave: 'cnes', titulo: 'CNES', render: (item) => item.cnes },
  { chave: 'nome', titulo: 'Nome', render: (item) => item.panel_name || item.nome || '-' },
  {
    chave: 'status',
    titulo: 'Status',
    render: (item) => <Pilula tom={item.is_online ? 'sucesso' : 'perigo'}>{item.is_online ? 'Online' : 'Offline'}</Pilula>,
  },
  { chave: 'atualizacao', titulo: 'Última atualização', render: (item) => <span className="text-muted-foreground">{formatRelativeTime(item.last_seen_at)}</span> },
];

export default function PainelEsusStatuses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.get('/painel-esus/statuses')
      .then((res) => {
        if (mounted) setItems(res.data?.items || []);
      })
      .catch(() => {
        if (mounted) setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredItems = items.filter((item) => {
    if (statusFilter === 'online') return Boolean(item.is_online);
    if (statusFilter === 'offline') return !item.is_online;
    return true;
  });

  return (
    <div className="ui-reset painel-esus-statuses-page">
      <CabecalhoDePagina titulo="Status dos Painéis de Senha" subtitulo="Lista de CNES com indicador visual de conectividade." />
      <div className="mb-4 flex justify-end">
        <CampoSelecao id="painel-esus-status-filter" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-w-[180px]">
          <option value="all">Todos</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </CampoSelecao>
      </div>
      <DataTable
        rotulo="painéis de senha"
        colunas={colunas}
        linhas={filteredItems}
        chaveDaLinha={(item) => item.cnes}
        carregando={loading}
        vazio="Nenhum CNES encontrado para o filtro selecionado."
      />
    </div>
  );
}
