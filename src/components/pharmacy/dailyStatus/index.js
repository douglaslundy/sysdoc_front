import React, { useEffect, useRef, useState } from 'react';
import { List } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import AlertModal from '../../messagesModal';
import MedicineDailyStatusDialog from '../../modal/medicineDailyStatus';
import { getMedicinesSelect } from '../../../store/fetchActions/medicines';
import { getDailyStatuses } from '../../../store/fetchActions/medicineDailyStatuses';
import { clearMedicinesState } from '../../../store/ducks/medicines';
import { clearDailyStatusesState } from '../../../store/ducks/medicineDailyStatuses';
import { clearAlertMessages, clearMessages } from '../../../store/ducks/Layout';
import { ActionCreateFab } from '../../actions';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { PaginaDeLista } from '../../ui/pagina-de-lista';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const statusLabel = (status) => {
  if (status === 'available') return 'Disponível';
  if (status === 'unavailable') return 'Indisponível';
  return 'Sem lançamento';
};

const formatDate = (value) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const truncate = (value, max = 40) => {
  const text = String(value || '');
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
};

const localDate = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export default function DailyStatusManager() {
  const dispatch = useDispatch();
  const { dailyStatuses, pagination } = useSelector((state) => state.medicineDailyStatuses);
  const { isOpenLoading } = useSelector((state) => state.layout);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [referenceDate, setReferenceDate] = useState(localDate());
  const [search, setSearch] = useState('');
  const [includeAll, setIncludeAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const searchRef = useRef(null);
  const totalCount = Number(pagination?.total || 0);
  const lastPageIndex = Math.max(0, Math.ceil(totalCount / perPage) - 1);

  const buildParams = (overrides = {}) => ({
    reference_date: referenceDate,
    search: search || undefined,
    include_all: includeAll ? 1 : undefined,
    availability_status: (includeAll && statusFilter) ? statusFilter : undefined,
    page: page + 1,
    per_page: perPage,
    ...overrides,
  });

  useEffect(() => {
    dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
      dispatch(clearMedicinesState());
      dispatch(clearDailyStatusesState());
      dispatch(clearAlertMessages());
      dispatch(clearMessages());
    };
  }, [dispatch]);

  const handleStatusFilter = ({ target }) => {
    const value = target.value;
    setStatusFilter(value);
    setPage(0);
    dispatch(getDailyStatuses(buildParams({ availability_status: value || undefined, page: 1 })));
  };

  useEffect(() => {
    dispatch(getDailyStatuses(buildParams({ page: 1 })));
  }, [referenceDate, includeAll, dispatch]);

  useEffect(() => {
    if (!includeAll) setStatusFilter('');
  }, [includeAll]);

  useEffect(() => {
    if (pagination?.current_page) {
      setPage(Math.max(0, pagination.current_page - 1));
    }
  }, [pagination?.current_page]);

  useEffect(() => {
    if (page > lastPageIndex) {
      setPage(lastPageIndex);
      dispatch(getDailyStatuses(buildParams({ page: lastPageIndex + 1 })));
    }
  }, [page, lastPageIndex, dispatch]);

  const handleSearch = ({ target }) => {
    const value = target.value;
    setSearch(value);
    setPage(0);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      dispatch(getDailyStatuses(buildParams({ search: value || undefined, page: 1 })));
    }, 400);
  };

  const handleReferenceDate = ({ target }) => {
    setReferenceDate(target.value);
    setPage(0);
  };

  const handleToggleIncludeAll = () => {
    setIncludeAll((current) => !current);
    setPage(0);
  };

  const handlePerPage = (value) => {
    setPerPage(value);
    setPage(0);
    dispatch(getDailyStatuses(buildParams({ per_page: value, page: 1 })));
  };

  const handlePage = (newPage) => {
    setPage(newPage);
    dispatch(getDailyStatuses(buildParams({ page: newPage + 1 })));
  };

  const onSuccess = () => {
    setDialogOpen(false);
    dispatch(getDailyStatuses(buildParams()));
  };

  const colunas = [
    {
      chave: 'medicamento',
      titulo: 'Medicamento',
      render: (s) => <span title={s.medicine_item?.active_ingredient || ''}>{truncate(s.medicine_item?.active_ingredient, 40)}</span>,
    },
    {
      chave: 'concentracao',
      titulo: 'Concentração',
      render: (s) => <span title={s.medicine_item?.concentration || ''}>{truncate(s.medicine_item?.concentration, 30) || '-'}</span>,
    },
    { chave: 'status', titulo: 'Status', render: (s) => statusLabel(s.availability_status) },
    { chave: 'quantidade', titulo: 'Quantidade', render: (s) => s.available_quantity ?? '-' },
    { chave: 'reposicao', titulo: 'Reposição', render: (s) => formatDate(s.restock_forecast_date) },
    { chave: 'obs', titulo: 'Observação', render: (s) => s.public_note || '-' },
  ];

  const barra = (
    <>
      <CampoTexto id="status-diario-data" label="Data de referência" type="date" value={referenceDate} onChange={handleReferenceDate} />
      {includeAll && (
        <CampoSelecao id="status-diario-status" label="Status" value={statusFilter} onChange={handleStatusFilter} className="min-w-[150px]">
          <option value="">Todos</option>
          <option value="available">Disponível</option>
          <option value="unavailable">Indisponível</option>
          <option value="no_record">Sem lançamento</option>
        </CampoSelecao>
      )}
      <Button variant={includeAll ? 'default' : 'outline'} onClick={handleToggleIncludeAll}>
        <List /> Exibir todos
      </Button>
      <ActionCreateFab title="Novo" onClick={() => setDialogOpen(true)} />
    </>
  );

  return (
    <PaginaDeLista
      titulo={`Status Diário de Medicamentos${pagination ? ` - ${pagination.total} registros` : ''}`}
      busca={{ rotulo: 'Pesquisar medicamento', placeholder: 'Pesquisar medicamento', value: search, onChange: handleSearch }}
      barra={barra}
      colunas={colunas}
      linhas={dailyStatuses}
      chaveDaLinha={(s) => s.id || `medicine-${s.medicine_item_id}`}
      carregando={Boolean(isOpenLoading)}
      vazio="Nenhum registro encontrado!"
      rotuloDaTabela="status diário de medicamentos"
      paginacao={{ total: totalCount, pagina: page, porPagina: perPage, opcoes: PER_PAGE_OPTIONS, aoMudarPagina: handlePage, aoMudarPorPagina: handlePerPage }}
    >
      <AlertModal />
      <MedicineDailyStatusDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={onSuccess} />
    </PaginaDeLista>
  );
}
