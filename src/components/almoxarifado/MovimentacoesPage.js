import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import AlertModal from '../messagesModal';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoDeBusca } from '../ui/campo-de-busca';
import { SelectNativo } from '../ui/campos';
import { DataTable } from '../ui/data-table';
import { Paginacao } from '../ui/paginacao';
import { Pilula } from '../ui/pilula';

const TYPE_META = {
  entrada: { tom: 'sucesso', label: 'Entrada' },
  saida: { tom: 'perigo', label: 'Saída' },
  ajuste: { tom: 'alerta', label: 'Ajuste' },
  transferencia: { tom: 'info', label: 'Transferência' },
  reservado: { tom: 'neutro', label: 'Reserva' },
};

export default function MovimentacoesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/almoxarifado/movimentacoes', {
        params: { page: page + 1, per_page: perPage, search: search || undefined, tipo: tipo || undefined },
      });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total ?? res.data?.meta?.total ?? 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [page, perPage, tipo]);

  const colunas = [
    { chave: 'data', titulo: 'Data', render: (row) => row.created_at || '-' },
    {
      chave: 'produto',
      titulo: 'Produto',
      render: (row) => (
        <>
          <span className="font-semibold">{row.produto?.nome || '-'}</span>
          <span className="block text-xs text-muted-foreground">{row.produto?.codigo_interno || '-'}</span>
        </>
      ),
    },
    {
      chave: 'tipo',
      titulo: 'Tipo',
      render: (row) => {
        const meta = TYPE_META[row.tipo] || { tom: 'neutro', label: row.tipo };
        return <Pilula tom={meta.tom}>{meta.label}</Pilula>;
      },
    },
    { chave: 'qtd', titulo: 'Qtd', render: (row) => <span className="font-mono">{Number(row.quantidade || 0).toFixed(3)}</span> },
    { chave: 'motivo', titulo: 'Motivo', render: (row) => row.motivo || '-' },
    { chave: 'usuario', titulo: 'Usuário', render: (row) => row.user?.name || '-' },
  ];

  return (
    <div className="ui-reset">
      <CabecalhoDePagina titulo="Movimentações" subtitulo="Entradas, saídas e transferências." />
      <AlertModal />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CampoDeBusca
          rotulo="Pesquisar produto"
          placeholder="Pesquisar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
        />
        <div className="w-full sm:w-52">
          <SelectNativo aria-label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste</option>
            <option value="transferencia">Transferência</option>
            <option value="reservado">Reserva</option>
          </SelectNativo>
        </div>
      </div>

      <DataTable rotulo="Movimentações" colunas={colunas} linhas={rows} chaveDaLinha={(row) => row.id} carregando={loading} vazio="Nenhuma movimentação encontrada." />
      <Paginacao
        total={total}
        pagina={page}
        porPagina={perPage}
        aoMudarPagina={setPage}
        aoMudarPorPagina={(n) => {
          setPerPage(n);
          setPage(0);
        }}
      />
    </div>
  );
}
