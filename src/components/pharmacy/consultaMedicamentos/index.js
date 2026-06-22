import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  styled,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../../baseCard/BaseCard';
import TableLoadingRows from '../../tableLoadingRows';
import { api } from '../../../services/api';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';

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
  if (item?.is_available) return { label: 'Disponível', color: 'success' };
  if (item?.availability_status === 'available') return { label: 'Disponível', color: 'success' };
  return { label: 'Indisponível', color: 'error' };
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
  const StyledTableRow = styled(TableRow)(() => ({
    '& td': {
      background: 'var(--queue-row-bg)',
      borderTop: '0.5px solid var(--lg-border)',
      borderBottom: '0.5px solid var(--lg-border)',
      paddingTop: 12,
      paddingBottom: 12,
      color: 'var(--queue-text-primary)',
    },
    '& td:first-of-type': { borderLeft: '0.5px solid var(--lg-border)', borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
    '& td:last-of-type': { borderRight: '0.5px solid var(--lg-border)', borderTopRightRadius: 14, borderBottomRightRadius: 14 },
    '&:hover td': { background: 'var(--queue-row-hover)' },
  }));

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

  const handlePerPage = (event) => {
    const value = Number(event.target.value);
    setPerPage(value);
    setPage(0);
    fetchMedicines({ per_page: value, page: 1 });
  };

  const handlePage = (_, newPage) => {
    setPage(newPage);
    fetchMedicines({ page: newPage + 1 });
  };

  const isEmpty = !loading && items.length === 0;

  return (
    <Box sx={modalFormRootSx} className="queue-page pharmacy-consulta-medicamentos-page pharmacy-medicines-page">
      <BaseCard title="Consulta de Medicamentos">
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            mt: 1,
          }}
        >
          <TextField
            className="lg-search-field"
            placeholder="Pesquisar medicamento pelo nome, código ou princípio ativo"
            value={search}
            onChange={handleSearch}
            sx={{ flex: '1 1 320px', minWidth: 240 }}
          />
          <FormControl className="lg-search-field" size="small" sx={{ flex: '0 1 190px', minWidth: 175 }}>
            <InputLabel>Disponibilidade</InputLabel>
            <Select value={availability} label="Disponibilidade" onChange={handleAvailabilityChange}>
              {availabilityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ ml: { xs: 0, md: 'auto' }, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FeatherIcon icon="eye" width="18" height="18" />
            <Typography variant="body2" color="text.secondary">
              Consulta somente leitura
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip size="small" color="success" variant="outlined" label={`Filtro: ${filteredLabel}`} />
          <Chip size="small" variant="outlined" label={`Página ${page + 1}`} />
          <Chip size="small" variant="outlined" label={`${perPage} por página`} />
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" sx={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th"><Typography variant="h6">Medicamento</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Estoque</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Disponibilidade</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Classificações</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Atualização</Typography></TableCell>
              </TableRow>
            </TableHead>

            {loading ? (
              <TableLoadingRows columns={5} rows={5} />
            ) : (
              <TableBody>
                {items.map((medicine) => {
                  const metaStatus = availabilityMeta(medicine);
                  const tags = [];
                  if (medicine.is_free_distribution) tags.push('Distribuição gratuita');
                  if (medicine.is_controlled) tags.push('Controlado');
                  if (medicine.is_judicial_order) tags.push('Ordem judicial');
                  if (medicine.is_high_cost) tags.push('Alto custo');
                  if (medicine.active) tags.push('Ativo');

                  return (
                    <StyledTableRow key={medicine.id} hover>
                      <TableCell title={`${medicine.active_ingredient || ''} ${medicine.concentration || ''}`.trim()}>
                        <Typography variant="h6" sx={{ fontSize: 14 }}>
                          {truncate(medicine.active_ingredient, 30)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {medicine.concentration || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" sx={{ fontSize: 14 }}>
                          {medicine.available_quantity ?? '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Estoque disponível
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" color={metaStatus.color} label={metaStatus.label} />
                      </TableCell>
                      <TableCell title={tags.join(' | ') || '-'}>
                        {tags.length ? truncate(tags.join(' | '), 36) : '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(medicine.last_status_updated_at)}
                        </Typography>
                      </TableCell>
                    </StyledTableRow>
                  );
                })}

                {isEmpty && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhum medicamento encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>

          <TablePagination
            className="queue-page__pagination"
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handlePage}
            rowsPerPage={perPage}
            onRowsPerPageChange={handlePerPage}
            rowsPerPageOptions={PER_PAGE_OPTIONS}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count.toLocaleString('pt-BR')}`}
          />
        </TableContainer>
      </BaseCard>
    </Box>
  );
}
