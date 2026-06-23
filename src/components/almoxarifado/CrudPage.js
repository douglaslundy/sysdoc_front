import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Fab, FormControl, InputLabel, MenuItem, Modal, Select, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, styled } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import TableLoadingRows from '../tableLoadingRows';
import { modalBackdropSx, modalFormRootSx, modalShellSx } from '../modal/_shared/modalFormStyles';

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

const initialValue = (field) => {
  if (field.type === 'switch') return field.defaultValue ?? true;
  return field.defaultValue ?? '';
};

const normalizePayload = (fields, form) => {
  const payload = {};
  fields.forEach((field) => {
    let value = form[field.name];
    if (field.type === 'number') {
      value = value === '' || value == null ? null : Number(value);
    }
    if (field.type === 'switch') {
      value = !!value;
    }
    if (value === '' && field.allowEmpty !== true) {
      value = null;
    }
    payload[field.name] = value;
  });
  return payload;
};

export default function CrudPage({
  title,
  subtitle,
  apiPath,
  fields,
  columns,
  perPageOptions = [10, 15, 25],
  tableActions = true,
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(perPageOptions[0] || 10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', confirm: null });
  const searchTimer = useRef(null);

  const emptyForm = useMemo(() => {
    const value = {};
    fields.forEach((field) => {
      value[field.name] = initialValue(field);
    });
    return value;
  }, [fields]);

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get(apiPath, { params: { page: page + 1, per_page: perPage, search: search || undefined, ...params } });
      const data = response.data;
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const meta = data?.meta || data?.pagination || {};
      setItems(list);
      setTotal(Number(meta.total ?? list.length));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [apiPath, page, perPage]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ ...emptyForm, ...row });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = normalizePayload(fields, form);
    if (editing?.id) {
      await api.put(`${apiPath}/${editing.id}`, payload);
    } else {
      await api.post(apiPath, payload);
    }
    setOpen(false);
    await load();
  };

  const handleDelete = (row) => {
    setConfirmDialog({
      isOpen: true,
      title: `Deseja inativar ${row.nome || 'o registro'}?`,
      subTitle: 'Esta ação não poderá ser desfeita.',
      confirm: async () => {
        await api.delete(`${apiPath}/${row.id}`);
        await load();
      },
    });
  };

  const onSearch = ({ target }) => {
    setSearch(target.value);
    setPage(0);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load({ search: target.value || undefined, page: 1 }), 350);
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page almoxarifado-crud-page">
      <BaseCard title={title}>
        <AlertModal />
        {subtitle ? (
          <Typography color="text.secondary" sx={{ mt: -1, mb: 2 }}>
            {subtitle}
          </Typography>
        ) : null}

        <Box className="queue-page__toolbar" sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <TextField
            className="lg-search-field"
            placeholder="Pesquisar..."
            value={search}
            onChange={onSearch}
            sx={{ flex: '1 1 280px', minWidth: 220 }}
          />
          <Fab
            className="queue-page__fab queue-page__fab--add"
            color="primary"
            size="medium"
            onClick={openCreate}
            sx={{ ml: 'auto', flexShrink: 0 }}
          >
            <FeatherIcon icon="plus" />
          </Fab>
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" sx={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} className="queue-page__th">
                    <Typography variant="h6" color="text.secondary">{column.label}</Typography>
                  </TableCell>
                ))}
                {tableActions && (
                  <TableCell align="center" className="queue-page__th">
                    <Typography variant="h6" color="text.secondary">Ações</Typography>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            {loading ? (
              <TableLoadingRows columns={columns.length + (tableActions ? 1 : 0)} rows={5} />
            ) : (
              <TableBody>
                {items.map((row) => (
                  <StyledTableRow key={row.id} hover>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render ? column.render(row) : row[column.key] ?? '-'}
                      </TableCell>
                    ))}
                    {tableActions && (
                      <TableCell align="center">
                        <Box sx={{ '& button': { mx: 0.75 } }}>
                          <Button
                            title="Editar"
                            onClick={() => openEdit(row)}
                            color="success"
                            size="medium"
                            variant="contained"
                            className="queue-page__action queue-page__action--success"
                          >
                            <FeatherIcon icon="edit" width="20" height="20" />
                          </Button>
                          <Button
                            title="Inativar"
                            onClick={() => handleDelete(row)}
                            color="error"
                            size="medium"
                            variant="contained"
                            className="queue-page__action queue-page__action--danger"
                          >
                            <FeatherIcon icon="trash" width="20" height="20" />
                          </Button>
                        </Box>
                      </TableCell>
                    )}
                  </StyledTableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length + (tableActions ? 1 : 0)} align="center">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
          <TablePagination
            className="queue-page__pagination"
            component="div"
            count={total}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={perPage}
            onRowsPerPageChange={(e) => {
              setPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={perPageOptions}
            labelRowsPerPage="Por página:"
          />
        </TableContainer>
      </BaseCard>

      <Modal keepMounted open={open} onClose={() => setOpen(false)} slotProps={{ backdrop: { sx: modalBackdropSx } }}>
        <Box sx={{ ...modalShellSx, ...modalFormRootSx }}>
          <BaseCard title={editing ? `Editar ${title}` : `Novo ${title}`}>
            <Stack spacing={2.2}>
              {fields.map((field) => {
                if (field.type === 'switch') {
                  return (
                    <Box key={field.name} display="flex" alignItems="center" justifyContent="space-between">
                      <Typography>{field.label}</Typography>
                      <Switch
                        checked={!!form[field.name]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.checked }))}
                      />
                    </Box>
                  );
                }

                if (field.type === 'select') {
                  return (
                    <FormControl fullWidth key={field.name}>
                      <InputLabel>{field.label}</InputLabel>
                      <Select
                        value={form[field.name] ?? ''}
                        label={field.label}
                        onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      >
                        <MenuItem value=""><em>Selecione</em></MenuItem>
                        {(field.options || []).map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                }

                return (
                  <TextField
                    key={field.name}
                    fullWidth
                    label={field.label}
                    type={field.type || 'text'}
                    value={form[field.name] ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    multiline={field.multiline}
                    rows={field.rows}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                    helperText={field.helperText}
                    inputProps={field.inputProps}
                  />
                );
              })}
            </Stack>

            <Box sx={{ display: 'flex', gap: 1, mt: 2.2 }}>
              <Button onClick={handleSave} variant="contained">Gravar</Button>
              <Button onClick={() => setOpen(false)} variant="outlined">Cancelar</Button>
            </Box>
          </BaseCard>
        </Box>
      </Modal>

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </Box>
  );
}
