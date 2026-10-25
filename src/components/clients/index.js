import React, { useContext, useEffect, useRef, useState } from "react";
import { BarChart3, Clock, Copy, Eye, Pencil, Plus, Trash2, Truck } from "lucide-react";

import ClientModal from "../modal/client";
import ClientViewModal from "../modal/client/view";
import ClientTripsModal from "../modal/client/trips";
import ClientReportModal from "../modal/client/report";
import ClientHistoryDrawer from "./ClientHistoryDrawer";
import DuplicateCleanupModal from "./DuplicateCleanupModal";
import { useSelector, useDispatch } from "react-redux";
import { api } from "../../services/api";
import {
  getAllClients,
  inactiveClientFetch,
} from "../../store/fetchActions/clients";
import { changeTitleAlert, openClientModal } from "../../store/ducks/Layout";
import { showClient } from "../../store/ducks/clients";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { parseISO, format } from "date-fns";
import { AuthContext } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { CabecalhoDePagina } from "../ui/cabecalho-de-pagina";
import { CampoDeBusca } from "../ui/campo-de-busca";
import { DataTable } from "../ui/data-table";
import { Paginacao } from "../ui/paginacao";

const safeText = (value, max = 30) => {
  if (!value) return "-";
  return String(value).substring(0, max).toUpperCase();
};

const maskMiddle = (value, keepStart = 2, keepEnd = 2) => {
  const text = String(value || '').trim();
  if (text.length <= keepStart + keepEnd) return text || '-';
  return `${text.slice(0, keepStart)}${'*'.repeat(text.length - keepStart - keepEnd)}${text.slice(-keepEnd)}`;
};

const maskDigits = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '-';
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 2)}${'*'.repeat(digits.length - 4)}${digits.slice(-2)}`;
};

// Botão de ação com contador no canto (viagens, relatório).
function BotaoComContagem({ total, children, ...props }) {
  return (
    <Button size="icon-sm" {...props}>
      <span className="relative inline-flex">
        {children}
        {total ? (
          <span aria-label={`${total} registros`} className="absolute -top-2.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-info-strong px-1 text-[10px] leading-none font-bold text-white">
            {total}
          </span>
        ) : null}
      </span>
    </Button>
  );
}

export default function Clients() {
  const { profile, canViewClientTrips, canViewClientReport, canViewClientHistory } = useContext(AuthContext);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "Deseja realmente excluir",
    subTitle: "Esta acao nao podera ser desfeita",
  });

  const dispatch = useDispatch();
  const { clients, pagination } = useSelector((state) => state.clients);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewClient, setViewClient] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [tripsClient, setTripsClient] = useState(null);
  const [tripsOpen, setTripsOpen] = useState(false);
  const [reportClient, setReportClient] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState(null);
  const searchRef = useRef(null);
  const isAdmin = profile === 'admin';

  const buildParams = (overrides = {}) => ({
    page: page + 1,
    per_page: rowsPerPage,
    search: searchValue || undefined,
    ...overrides,
  });

  const handleEditClient = (client) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja editar o cliente ${client.name}`,
      onConfirm: () => {
        dispatch(showClient(client));
        dispatch(openClientModal());
      },
    });
  };

  const handleViewClient = async (client) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewError('');
    setViewClient(null);

    try {
      const { data } = await api.get(`/clients/${client.id}`);
      setViewClient(data);
    } catch (error) {
      setViewError(error?.response?.data?.message || 'Não foi possível carregar os dados do cliente.');
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseViewClient = () => {
    setViewOpen(false);
    setViewClient(null);
    setViewError('');
    setViewLoading(false);
  };

  // Viagens só são buscadas quando o botão é clicado (lazy) — o modal só é
  // montado quando tripsOpen é true, então o fetch (dentro do modal) nunca
  // roda por antecipação para cada linha da lista.
  const handleOpenTrips = (client) => {
    setTripsClient(client);
    setTripsOpen(true);
  };

  const handleCloseTrips = () => {
    setTripsOpen(false);
    setTripsClient(null);
  };

  // Relatório detalhado só é buscado quando o botão é clicado (lazy) — o
  // modal só é montado quando reportOpen é true, mesmo padrão do
  // ClientTripsModal (mesmo motivo: evitar fetch antecipado por linha).
  const handleOpenReport = (client) => {
    setReportClient(client);
    setReportOpen(true);
  };

  const handleCloseReport = () => {
    setReportOpen(false);
    setReportClient(null);
  };

  const handleInactiveClient = (client) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja realmente excluir o cliente ${client.name}`,
      confirm: inactiveClientFetch(client),
    });
    dispatch(changeTitleAlert(`O cliente ${client.name} foi inativado com sucesso!`));
  };

  const searchClients = ({ target }) => {
    const value = target.value;
    setSearchValue(value);
    setPage(0);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      dispatch(getAllClients(buildParams({ search: value || undefined, page: 1 })));
    }, 400);
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
    dispatch(getAllClients(buildParams({ page: newPage + 1 })));
  };

  const handleChangeRowsPerPage = (event) => {
    const value = parseInt(event.target.value, 10);
    setRowsPerPage(value);
    setPage(0);
    dispatch(getAllClients(buildParams({ per_page: value, page: 1 })));
  };

  useEffect(() => {
    dispatch(getAllClients({ page: 1, per_page: rowsPerPage }));
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, []);

  useEffect(() => {
    if (pagination?.current_page) {
      setPage(Math.max(0, pagination.current_page - 1));
    }
  }, [pagination?.current_page]);

  const totalRelatorio = (client) => (client?.trips_count || 0) + (client?.queue_count || 0) + (client?.pedidos_exame_count || 0);

  const colunas = [
    {
      chave: "nome",
      titulo: "Nome / DN",
      render: (client) => (
        <>
          <span className="font-bold">{safeText(client?.name, 35)}</span>
          <span className="block text-xs text-muted-foreground">
            {client?.born_date ? maskMiddle(format(parseISO(client.born_date), "dd/MM/yyyy")) : "-"}
          </span>
        </>
      ),
    },
    {
      chave: "mae",
      titulo: "Mãe / CPF / CNS",
      render: (client) => (
        <>
          <span className="font-bold">{safeText(client?.mother, 30)}</span>
          <span className="block text-xs text-muted-foreground">{maskDigits(client?.cpf)}</span>
          <span className="block text-xs text-muted-foreground">{maskDigits(client?.cns)}</span>
        </>
      ),
    },
    {
      chave: "contato",
      titulo: "Telefone / Endereço",
      render: (client) => (
        <>
          <span className="block">{maskDigits(client?.phone)}</span>
          <span className="block">
            {maskMiddle(
              [client?.addresses?.street, client?.addresses?.number, client?.addresses?.district]
                .filter(Boolean)
                .join(', '),
            )}
          </span>
          <span className="block">{maskMiddle(client?.addresses?.city || '-')}</span>
        </>
      ),
    },
    {
      chave: "acoes",
      titulo: "Ações",
      render: (client) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="icon-sm" title="Visualizar cliente" aria-label="Visualizar cliente" onClick={() => handleViewClient(client)}>
            <Eye />
          </Button>
          <Button variant="success" size="icon-sm" title="Editar cliente" aria-label="Editar cliente" onClick={() => handleEditClient(client)}>
            <Pencil />
          </Button>
          <Button variant="destructive" size="icon-sm" title="Excluir cliente" aria-label="Excluir cliente" onClick={() => handleInactiveClient(client)}>
            <Trash2 />
          </Button>
          {canViewClientTrips && (
            <BotaoComContagem variant="outline" total={client?.trips_count || 0} title="Ver viagens do cliente" aria-label="Ver viagens do cliente" onClick={() => handleOpenTrips(client)}>
              <Truck className="size-4" />
            </BotaoComContagem>
          )}
          {canViewClientHistory && (
            <Button variant="outline" size="icon-sm" title="Histórico do cidadão" aria-label="Histórico do cidadão" onClick={() => setHistoryClient(client)}>
              <Clock />
            </Button>
          )}
          {canViewClientReport && (
            <BotaoComContagem variant="outline" total={totalRelatorio(client)} title="Relatório detalhado do cliente" aria-label="Relatório detalhado do cliente" onClick={() => handleOpenReport(client)}>
              <BarChart3 className="size-4" />
            </BotaoComContagem>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <CabecalhoDePagina titulo="Cidadãos" subtitulo={`Você possui ${pagination?.total || clients.length} cidadãos cadastrados`} />
      <AlertModal />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CampoDeBusca
          rotulo="Pesquisar cliente"
          placeholder="Pesquisar cliente: Nome / Telefone / CPF ou CNS"
          name="search"
          value={searchValue}
          onChange={searchClients}
        />
        <ClientModal>
          <Button onClick={() => dispatch(openClientModal())}>
            <Plus /> Novo cidadão
          </Button>
        </ClientModal>
        {isAdmin && (
          <Button variant="secondary" onClick={() => setDuplicatesOpen(true)}>
            <Copy /> Duplicados
          </Button>
        )}
      </div>

      <DataTable rotulo="Clientes" colunas={colunas} linhas={clients} chaveDaLinha={(client) => client.id} vazio="Nenhum registro encontrado!" />
      <Paginacao
        total={pagination?.total ?? clients.length}
        pagina={page}
        porPagina={rowsPerPage}
        aoMudarPagina={(n) => handleChangePage(null, n)}
        aoMudarPorPagina={(n) => handleChangeRowsPerPage({ target: { value: String(n) } })}
      />

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} isAuthenticated />

      <ClientViewModal open={viewOpen} client={viewClient} loading={viewLoading} error={viewError} onClose={handleCloseViewClient} />

      {tripsOpen && <ClientTripsModal client={tripsClient} onClose={handleCloseTrips} />}

      {reportOpen && <ClientReportModal client={reportClient} onClose={handleCloseReport} />}

      {canViewClientHistory && (
        <ClientHistoryDrawer open={Boolean(historyClient)} client={historyClient} onClose={() => setHistoryClient(null)} />
      )}

      {isAdmin && (
        <DuplicateCleanupModal
          open={duplicatesOpen}
          onClose={() => setDuplicatesOpen(false)}
          onReload={() => dispatch(getAllClients(buildParams({ page: page + 1 })))}
        />
      )}
    </div>
  );
}
