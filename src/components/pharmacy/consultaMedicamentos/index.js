import React, { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { api } from '../../../services/api';
import { CabecalhoDePagina } from '../../ui/cabecalho-de-pagina';
import { CampoDeBusca } from '../../ui/campo-de-busca';
import { CampoSelecao } from '../../ui/campos';
import { DataTable } from '../../ui/data-table';
import { Paginacao } from '../../ui/paginacao';
import { Pilula } from '../../ui/pilula';

const PER_PAGE_OPTIONS = [15, 50, 100];

const availabilityOptions = [
  { value: 'available', label: 'Disponíveis' },
  { value: 'unavailable', label: 'Indisponíveis' },
  { value: 'all', label: 'Todos' },
];

const truncate = (value, max = 30) => {
  if (!value) return '-';
  const text = String(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const availabilityMeta = (item) => {
  if (item?.is_available) return { label: 'Disponível', tom: 'sucesso' };
  if (item?.availability_status === 'available') return { label: 'Disponível', tom: 'sucesso' };
  return { label: 'Indisponível', tom: 'perigo' };
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function ConsultaMedicamentos() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('available');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);

  const fetchMedicines = (params = {}) => {
    setLoading(true);
    setErro(null);

    api.get('/medicines', {
      params: {
        page: page + 1,
        per_page: perPage,
        search: search || undefined,
        availability_status: availability === 'all' ? undefined : availability,
        ...params,
      },
    })
      .then((res) => {
        setItems(res.data?.data || []);
        setMeta(res.data?.meta || null);
      })
      .catch((error) => {
        setErro(error);
        setItems([]);
        setMeta(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedicines({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCount = Number(meta?.total || 0);
  const lastPageIndex = Math.max(0, Math.ceil(totalCount / perPage) - 1);

  useEffect(() => {
    if (meta?.current_page) {
      setPage(Math.max(0, meta.current_page - 1));
    }
  }, [meta?.current_page]);

  useEffect(() => {
    if (page > lastPageIndex) {
      setPage(lastPageIndex);
      fetchMedicines({ page: lastPageIndex + 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, lastPageIndex]);

  const filteredLabel = useMemo(() => {
    const option = availabilityOptions.find((item) => item.value === availability);
    return option?.label || 'Disponíveis';
  }, [availability]);

  const handleSearch = ({ target }) => {
    const value = target.value;
    setSearch(value);
    setPage(0);
    fetchMedicines({ search: value || undefined, page: 1 });
  };

  const handleAvailabilityChange = (event) => {
    const value = event.target.value;
    setAvailability(value);
    setPage(0);
    fetchMedicines({
      availability_status: value === 'all' ? undefined : value,
      page: 1,
    });
  };

  const handlePerPage = (value) => {
    setPerPage(value);
    setPage(0);
    fetchMedicines({ per_page: value, page: 1 });
  };

  const handlePage = (newPage) => {
    setPage(newPage);
    fetchMedicines({ page: newPage + 1 });
  };

  const colunas = [
    {
      chave: 'medicamento',
      titulo: 'Medicamento',
      render: (medicine) => (
        <span title={`${medicine.active_ingredient || ''} ${medicine.concentration || ''}`.trim()}>
          <span className="block font-semibold">{truncate(medicine.active_ingredient, 30)}</span>
          <span className="block text-xs text-muted-foreground">{medicine.concentration || '-'}</span>
        </span>
      ),
    },
    {
      chave: 'estoque',
      titulo: 'Estoque',
      render: (medicine) => (
        <>
          <span className="block font-semibold">{medicine.available_quantity ?? '-'}</span>
          <span className="block text-xs text-muted-foreground">Estoque disponível</span>
        </>
      ),
    },
    {
      chave: 'disponibilidade',
      titulo: 'Disponibilidade',
      render: (medicine) => {
        const metaStatus = availabilityMeta(medicine);
        return <Pilula tom={metaStatus.tom}>{metaStatus.label}</Pilula>;
      },
    },
    {
      chave: 'classificacoes',
      titulo: 'Classificações',
      render: (medicine) => {
        const tags = [];
        if (medicine.is_free_distribution) tags.push('Distribuição gratuita');
        if (medicine.is_controlled) tags.push('Controlado');
        if (medicine.is_judicial_order) tags.push('Ordem judicial');
        if (medicine.is_high_cost) tags.push('Alto custo');
        if (medicine.active) tags.push('Ativo');
        return <span title={tags.join(' | ') || '-'}>{tags.length ? truncate(tags.join(' | '), 36) : '-'}</span>;
      },
    },
    { chave: 'atualizacao', titulo: 'Atualização', render: (medicine) => formatDateTime(medicine.last_status_updated_at) },
  ];

  return (
    <div className="ui-reset pharmacy-consulta-medicamentos-page pharmacy-medicines-page">
      <CabecalhoDePagina titulo="Consulta de Medicamentos" />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <CampoDeBusca
          className="min-w-[240px] flex-[1_1_320px]"
          rotulo="Pesquisar medicamento"
          placeholder="Pesquisar medicamento pelo nome, código ou princípio ativo"
          value={search}
          onChange={handleSearch}
        />
        <CampoSelecao id="consulta-disponibilidade" label="Disponibilidade" value={availability} onChange={handleAvailabilityChange} className="min-w-[175px]">
          {availabilityOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </CampoSelecao>
        <p className="flex items-center gap-2 text-sm text-muted-foreground md:ml-auto">
          <Eye className="size-4" aria-hidden /> Consulta somente leitura
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Pilula tom="sucesso" contorno>{`Filtro: ${filteredLabel}`}</Pilula>
        <Pilula tom="neutro" contorno>{`Página ${page + 1}`}</Pilula>
        <Pilula tom="neutro" contorno>{`${perPage} por página`}</Pilula>
      </div>

      <DataTable
        rotulo="medicamentos"
        colunas={colunas}
        linhas={items}
        chaveDaLinha={(medicine) => medicine.id}
        carregando={loading}
        vazio="Nenhum medicamento encontrado para os filtros selecionados."
      />
      <Paginacao total={totalCount} pagina={page} porPagina={perPage} opcoes={PER_PAGE_OPTIONS} aoMudarPagina={handlePage} aoMudarPorPagina={handlePerPage} />
    </div>
  );
}
