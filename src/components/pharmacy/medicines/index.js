import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AlertModal from '../../messagesModal';
import ConfirmDialog from '../../confirmDialog';
import MedicineDialog from '../../modal/medicine';
import { getAllMedicines, removeMedicineFetch } from '../../../store/fetchActions/medicines';
import { clearMedicinesState } from '../../../store/ducks/medicines';
import { clearAlertMessages, clearMessages } from '../../../store/ducks/Layout';
import { ActionCreateFab } from '../../actions';
import { AcoesDeLinha } from '../../ui/acoes-de-linha';
import { CampoSelecao } from '../../ui/campos';
import { PaginaDeLista } from '../../ui/pagina-de-lista';
import { Pilula } from '../../ui/pilula';

const PER_PAGE_OPTIONS = [15, 50, 100];

const availabilityOptions = [
  { value: 'available', label: 'Disponíveis' },
  { value: 'unavailable', label: 'Indisponíveis' },
];

const truncate = (value, max = 30) => {
  if (!value) return '-';
  const text = String(value);
  return text.length > max ? `${text.substring(0, max)}...` : text;
};

const availabilityMeta = (value) => {
  if (value === 'available') {
    return { label: 'Disponível', tom: 'sucesso' };
  }

  return { label: 'Indisponível', tom: 'perigo' };
};

const renderTags = (medicine) => {
  const tags = [];
  if (medicine.is_free_distribution) tags.push('Distribuição Gratuita');
  if (medicine.is_controlled) tags.push('Controlado');
  if (medicine.is_judicial_order) tags.push('Ordem Judicial');
  if (medicine.is_high_cost) tags.push('Alto Custo');
  if (medicine.active) tags.push('Ativo');
  return tags.length ? tags.join(' | ') : '-';
};

export default function MedicinesManager() {
  const dispatch = useDispatch();
  const { medicines, pagination } = useSelector((state) => state.medicines);
  const { isOpenLoading } = useSelector((state) => state.layout);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ availability_status: 'available' });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const searchRef = useRef(null);
  const totalCount = Number(pagination?.total || 0);
  const lastPageIndex = Math.max(0, Math.ceil(totalCount / perPage) - 1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', confirm: null });

  const buildParams = (currentFilters = filters, overrides = {}) => ({
    page: page + 1,
    per_page: perPage,
    search: search || undefined,
    availability_status: currentFilters.availability_status || undefined,
    ...overrides,
  });

  useEffect(() => {
    dispatch(getAllMedicines(buildParams({ availability_status: 'available' }, { page: 1 })));
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
      dispatch(clearMedicinesState());
      dispatch(clearAlertMessages());
      dispatch(clearMessages());
    };
  }, [dispatch]);

  useEffect(() => {
    if (pagination?.current_page) {
      setPage(Math.max(0, pagination.current_page - 1));
    }
  }, [pagination?.current_page]);

  useEffect(() => {
    if (page > lastPageIndex) {
      setPage(lastPageIndex);
      dispatch(getAllMedicines(buildParams(filters, { page: lastPageIndex + 1 })));
    }
  }, [page, lastPageIndex, dispatch]);

  const handleSearch = ({ target }) => {
    const value = target.value;
    setSearch(value);
    setPage(0);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      dispatch(getAllMedicines(buildParams(filters, { search: value || undefined, page: 1 })));
    }, 400);
  };

  const handlePerPage = (value) => {
    setPerPage(value);
    setPage(0);
    dispatch(getAllMedicines(buildParams(filters, { per_page: value, page: 1 })));
  };

  const handleAvailabilityChange = (event) => {
    const next = { ...filters, availability_status: event.target.value };
    setFilters(next);
    setPage(0);
    dispatch(getAllMedicines(buildParams(next, { page: 1 })));
  };

  const handlePage = (newPage) => {
    setPage(newPage);
    dispatch(getAllMedicines(buildParams(filters, { page: newPage + 1 })));
  };

  const onSuccess = () => {
    setDialogOpen(false);
    dispatch(getAllMedicines(buildParams(filters)));
  };

  const colunas = [
    {
      chave: 'medicamento',
      titulo: 'Medicamento',
      render: (medicine) => (
        <>
          <span className="block font-semibold" title={medicine.active_ingredient || ''}>{truncate(medicine.active_ingredient, 30)}</span>
          <span className="block text-xs text-muted-foreground">{medicine.concentration || '-'}</span>
        </>
      ),
    },
    {
      chave: 'estoque',
      titulo: 'Estoque',
      render: (medicine) => (
        <>
          <span className="block font-semibold">{medicine.available_quantity ?? '-'}</span>
          <span className="block text-xs text-muted-foreground">
            {medicine.last_status_updated_at ? `Atualizado em ${medicine.last_status_updated_at}` : 'Sem lançamento'}
          </span>
        </>
      ),
    },
    {
      chave: 'disponibilidade',
      titulo: 'Disponibilidade',
      render: (medicine) => {
        const meta = availabilityMeta(medicine.availability_status);
        return <Pilula tom={meta.tom}>{meta.label}</Pilula>;
      },
    },
    {
      chave: 'classificacoes',
      titulo: 'Classificações',
      render: (medicine) => <span title={renderTags(medicine)}>{truncate(renderTags(medicine), 60)}</span>,
    },
    {
      chave: 'acoes',
      titulo: 'Ações',
      render: (medicine) => (
        <AcoesDeLinha
          aoEditar={() => {
            setEditing(medicine);
            setDialogOpen(true);
          }}
          aoExcluir={() => setConfirmDialog({
            isOpen: true,
            title: `Remover ${medicine.active_ingredient}?`,
            subTitle: 'Esta ação não pode ser desfeita.',
            confirm: removeMedicineFetch(medicine.id),
          })}
        />
      ),
    },
  ];

  const barra = (
    <>
      <CampoSelecao id="medicamentos-disponibilidade" label="Disponibilidade" value={filters.availability_status} onChange={handleAvailabilityChange} className="min-w-[175px]">
        {availabilityOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </CampoSelecao>
      <ActionCreateFab
        title="Novo"
        className="ml-auto"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      />
    </>
  );

  return (
    <PaginaDeLista
      titulo={`Medicamentos${pagination ? ` - ${pagination.total} registros` : ''}`}
      busca={{ rotulo: 'Pesquisar medicamento', placeholder: 'Pesquisar medicamento pelo nome', value: search, onChange: handleSearch }}
      barra={barra}
      colunas={colunas}
      linhas={medicines}
      chaveDaLinha={(medicine) => medicine.id}
      carregando={Boolean(isOpenLoading)}
      vazio="Nenhum medicamento encontrado com esse filtro."
      rotuloDaTabela="medicamentos"
      paginacao={{ total: totalCount, pagina: page, porPagina: perPage, opcoes: PER_PAGE_OPTIONS, aoMudarPagina: handlePage, aoMudarPorPagina: handlePerPage }}
    >
      <AlertModal />
      <MedicineDialog open={dialogOpen} onClose={() => setDialogOpen(false)} medicine={editing} onSuccess={onSuccess} />
      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </PaginaDeLista>
  );
}
