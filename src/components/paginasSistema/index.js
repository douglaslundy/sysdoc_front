import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, Fab, FormControlLabel, MenuItem, Modal, Select,
    Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination, TableRow, TextField, Typography, FormControl, InputLabel,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { getAllPages, addPageFetch, editPageFetch, removePageFetch } from '../../store/fetchActions/accessProfiles';
import AlertModal from '../messagesModal';
import BaseCard from '../baseCard/BaseCard';

const modalStyle = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%', height: '98%',
    bgcolor: 'background.paper', border: '0px solid #000',
    boxShadow: 24, p: 4, overflow: 'scroll',
};

const FORM_INICIAL = { titulo: '', path: '', icone: '', categoria: '', ativo: true };

const CATEGORIAS = ['Geral', 'Administração', 'Cadastros', 'Laboratório', 'Atendimento', 'TFD', 'Documentos', 'Relatórios', 'Outros'];

// Ícones sugeridos do Feather Icons usados no sistema
const ICONES = [
    'home', 'pie-chart', 'user', 'users', 'shield', 'bar-chart-2',
    'thermometer', 'clipboard', 'tag', 'user-check', 'calendar',
    'award', 'layers', 'truck', 'map', 'map-pin', 'send', 'file-text',
    'cpu', 'tool', 'grid', 'monitor', 'activity', 'plus-circle', 'layout',
    'alert-triangle', 'maximize', 'settings', 'lock', 'key', 'log-in',
];

export default function PaginasSistema() {
    const dispatch = useDispatch();
    const { pages } = useSelector(state => state.accessProfiles);

    const [openModal, setOpenModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    useEffect(() => {
        dispatch(getAllPages());
    }, []);

    const filtradas = pages.filter(p =>
        p.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
        p.path?.toLowerCase().includes(busca.toLowerCase()) ||
        p.categoria?.toLowerCase().includes(busca.toLowerCase())
    );

    const handleNova = () => {
        setEditId(null);
        setForm(FORM_INICIAL);
        setOpenModal(true);
    };

    const handleEditar = (pg) => {
        setEditId(pg.id);
        setForm({
            titulo:    pg.titulo,
            path:      pg.path,
            icone:     pg.icone || '',
            categoria: pg.categoria || '',
            ativo:     pg.ativo,
        });
        setOpenModal(true);
    };

    const handleSave = () => {
        if (editId) {
            dispatch(editPageFetch(editId, form, () => setOpenModal(false)));
        } else {
            dispatch(addPageFetch(form, () => setOpenModal(false)));
        }
    };

    const handleChange = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    return (
        <>
            <BaseCard title={`Você possui ${pages.length} Páginas Cadastradas no Sistema`}>
                <AlertModal />
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
                    <TextField
                        size="small"
                        placeholder="Buscar por título, path ou categoria..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        inputProps={{ maxLength: 80 }}
                        sx={{ minWidth: 320 }}
                    />
                    <Fab color="primary" title="Nova Página" onClick={handleNova}>
                        <FeatherIcon icon="plus" />
                    </Fab>
                </Box>

                <TableContainer>
                    <Table aria-label="paginas" sx={{ mt: 1, whiteSpace: 'nowrap' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography color="textSecondary" variant="h6">Título</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Path</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Ícone</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Categoria</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Status</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Ações</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtradas
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map(pg => (
                                    <TableRow key={pg.id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {pg.icone && (
                                                    <FeatherIcon icon={pg.icone} width="16" height="16" />
                                                )}
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>{pg.titulo}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.3, borderRadius: 1, display: 'inline-block' }}
                                            >
                                                {pg.path}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography color="textSecondary" sx={{ fontSize: '12px' }}>{pg.icone || '—'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {pg.categoria
                                                ? <Chip label={pg.categoria} size="small" variant="outlined" />
                                                : <Typography color="textSecondary" sx={{ fontSize: '12px' }}>—</Typography>
                                            }
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={pg.ativo ? 'Ativa' : 'Inativa'}
                                                color={pg.ativo ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ '& button': { mx: 1 } }}>
                                                <Button
                                                    title="Editar página"
                                                    onClick={() => handleEditar(pg)}
                                                    color="success"
                                                    size="medium"
                                                    variant="contained"
                                                >
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>
                                                <Button
                                                    title="Remover página"
                                                    onClick={() => dispatch(removePageFetch(pg.id))}
                                                    color="error"
                                                    size="medium"
                                                    variant="contained"
                                                >
                                                    <FeatherIcon icon="trash" width="20" height="20" />
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {filtradas.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography color="text.secondary">Nenhuma página encontrada</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={filtradas.length}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[10, 15, 25]}
                        labelRowsPerPage="Por página:"
                    />
                </TableContainer>
            </BaseCard>

            {/* Modal Página */}
            <Modal keepMounted open={openModal} onClose={() => setOpenModal(false)}>
                <Box sx={modalStyle}>
                    <AlertModal />
                    <BaseCard title={editId ? 'Editar Página do Sistema' : 'Nova Página do Sistema'}>
                        <Stack spacing={3}>
                            <TextField
                                fullWidth
                                label="Título da Página"
                                name="titulo"
                                value={form.titulo}
                                onChange={handleChange}
                                required
                                inputProps={{ maxLength: 80 }}
                                helperText="Nome exibido no menu e nas permissões"
                            />

                            <TextField
                                fullWidth
                                label="Path (rota)"
                                name="path"
                                value={form.path}
                                onChange={handleChange}
                                required
                                inputProps={{ maxLength: 120 }}
                                helperText='Caminho da página, ex: /laboratorio/exames'
                                InputProps={{
                                    sx: { fontFamily: 'monospace' },
                                }}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Categoria</InputLabel>
                                <Select
                                    name="categoria"
                                    value={form.categoria}
                                    label="Categoria"
                                    onChange={handleChange}
                                >
                                    <MenuItem value=""><em>Sem categoria</em></MenuItem>
                                    {CATEGORIAS.map(c => (
                                        <MenuItem key={c} value={c}>{c}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Ícone</InputLabel>
                                <Select
                                    name="icone"
                                    value={form.icone}
                                    label="Ícone"
                                    onChange={handleChange}
                                    renderValue={val => val ? (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FeatherIcon icon={val} width="16" height="16" />
                                            <span>{val}</span>
                                        </Box>
                                    ) : <em>Sem ícone</em>}
                                >
                                    <MenuItem value=""><em>Sem ícone</em></MenuItem>
                                    {ICONES.map(ic => (
                                        <MenuItem key={ic} value={ic}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <FeatherIcon icon={ic} width="16" height="16" />
                                                <span>{ic}</span>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.ativo}
                                        onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                                    />
                                }
                                label="Página ativa"
                            />
                        </Stack>
                        <br />
                        <Box sx={{ '& button': { mx: 1 } }}>
                            <Button variant="contained" onClick={handleSave}>Gravar</Button>
                            <Button variant="outlined" onClick={() => setOpenModal(false)}>Cancelar</Button>
                        </Box>
                    </BaseCard>
                </Box>
            </Modal>
        </>
    );
}
