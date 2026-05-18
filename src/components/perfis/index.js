import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, Fab, Table, TableBody, TableCell, TableContainer,
    TableHead, TablePagination, TableRow, Typography, Modal, Stack,
    TextField, FormControlLabel, Switch, Checkbox, FormGroup, FormLabel,
    FormControl, Grid,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { ActionCreateFab, ActionDeleteButton, ActionEditButton } from '../actions';
import { getAllProfiles, getAllPages, addProfileFetch, editProfileFetch, removeProfileFetch } from '../../store/fetchActions/accessProfiles';
import AlertModal from '../messagesModal';
import BaseCard from '../baseCard/BaseCard';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const modalStyle = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%', height: '98%',
    bgcolor: 'var(--lg-glass-modal)',
    backdropFilter: 'var(--lg-blur-modal)',
    WebkitBackdropFilter: 'var(--lg-blur-modal)',
    border: '0.5px solid var(--lg-border)',
    boxShadow: 24, p: 4, overflow: 'scroll',
};

const FORM_INICIAL = { nome: '', slug: '', descricao: '', ativo: true, page_ids: [] };

function agruparPorCategoria(pages) {
    return pages.reduce((acc, page) => {
        const cat = page.categoria || 'Outros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(page);
        return acc;
    }, {});
}

export default function Perfis() {
    const dispatch = useDispatch();
    const { profiles, pages } = useSelector((state) => state.accessProfiles);

    const [openModal, setOpenModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        dispatch(getAllProfiles());
        dispatch(getAllPages());
    }, [dispatch]);

    const handleNovo = () => {
        setEditId(null);
        setForm(FORM_INICIAL);
        setOpenModal(true);
    };

    const handleEditar = (profile) => {
        setEditId(profile.id);
        setForm({
            nome: profile.nome,
            slug: profile.slug,
            descricao: profile.descricao || '',
            ativo: profile.ativo,
            page_ids: profile.pages?.map((p) => p.id) || [],
        });
        setOpenModal(true);
    };

    const handleTogglePage = (pageId) => {
        setForm((f) => ({
            ...f,
            page_ids: f.page_ids.includes(pageId)
                ? f.page_ids.filter((id) => id !== pageId)
                : [...f.page_ids, pageId],
        }));
    };

    const handleSave = () => {
        if (editId) {
            dispatch(editProfileFetch(editId, form, () => { setOpenModal(false); dispatch(getAllProfiles()); }));
        } else {
            dispatch(addProfileFetch(form, () => { setOpenModal(false); dispatch(getAllProfiles()); }));
        }
    };

    const categorias = agruparPorCategoria(pages);
    const perfisFiltrados = profiles.filter((profile) =>
        profile.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        profile.slug?.toLowerCase().includes(busca.toLowerCase()) ||
        profile.descricao?.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <Box sx={modalFormRootSx}>
            <BaseCard title={`Voce possui ${profiles.length} Perfis de Acesso Cadastrados`}>
                <AlertModal />
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} flexWrap="nowrap" mb={2} sx={{ overflowX: 'auto' }}>
                    <TextField
                        className="lg-search-field"
                        size="small"
                        placeholder="Buscar por nome, slug ou descricao..."
                        value={busca}
                        onChange={(e) => { setBusca(e.target.value); setPage(0); }}
                        inputProps={{ maxLength: 80 }}
                        sx={{ minWidth: 260, flex: 1 }}
                    />
                    <ActionCreateFab title="Novo Perfil" onClick={handleNovo} />
                </Box>
                <TableContainer>
                    <Table aria-label="perfis" sx={{ mt: 1, whiteSpace: 'nowrap' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography color="textSecondary" variant="h6">Nome / Slug</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Descricao</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Paginas</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Status</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Acoes</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {perfisFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((profile) => (
                                <TableRow key={profile.id} hover>
                                    <TableCell>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{profile.nome}</Typography>
                                        <Typography color="textSecondary" sx={{ fontSize: '12px' }}>{profile.slug}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h6">{profile.descricao || '-'}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={`${profile.pages?.length || 0} paginas`} size="small" color="info" />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={profile.ativo ? 'Ativo' : 'Inativo'} color={profile.ativo ? 'success' : 'error'} size="small" />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ '& button': { mx: 1 } }}>
                                            <ActionEditButton
                                                title="Editar perfil"
                                                onClick={() => handleEditar(profile)}
                                            />
                                            <ActionDeleteButton
                                                title="Remover perfil"
                                                onClick={() => dispatch(removeProfileFetch(profile.id))}
                                            />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {perfisFiltrados.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography color="text.secondary">Nenhum perfil encontrado</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={perfisFiltrados.length}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[10, 25]}
                        labelRowsPerPage="Por pagina:"
                    />
                </TableContainer>
            </BaseCard>

            <Modal keepMounted open={openModal} onClose={() => setOpenModal(false)}>
                <Box sx={modalStyle}>
                    <AlertModal />
                    <BaseCard title={editId ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}>
                        <Stack spacing={3}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        className="lg-search-field"
                                        fullWidth
                                        label="Nome do Perfil"
                                        value={form.nome}
                                        onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                                        required
                                        inputProps={{ maxLength: 60 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        className="lg-search-field"
                                        fullWidth
                                        label="Slug (identificador)"
                                        value={form.slug}
                                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
                                        required
                                        inputProps={{ maxLength: 60 }}
                                        helperText="Apenas letras minusculas, numeros e hifens"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        className="lg-search-field"
                                        fullWidth
                                        label="Descricao"
                                        value={form.descricao}
                                        onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                                        inputProps={{ maxLength: 200 }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={<Switch checked={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} />}
                                        label="Perfil ativo"
                                    />
                                </Grid>
                            </Grid>

                            <Typography variant="h5" fontWeight="bold">Paginas com Acesso</Typography>

                            {Object.entries(categorias).map(([categoria, catPages]) => (
                                <FormControl key={categoria} component="fieldset">
                                    <FormLabel component="legend" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                        {categoria}
                                    </FormLabel>
                                    <FormGroup row>
                                        {catPages.map((pg) => (
                                            <FormControlLabel
                                                key={pg.id}
                                                control={
                                                    <Checkbox
                                                        checked={form.page_ids.includes(pg.id)}
                                                        onChange={() => handleTogglePage(pg.id)}
                                                        size="small"
                                                    />
                                                }
                                                label={pg.titulo}
                                                sx={{ minWidth: 200 }}
                                            />
                                        ))}
                                    </FormGroup>
                                </FormControl>
                            ))}
                        </Stack>
                        <br />
                        <Box sx={{ '& button': { mx: 1 } }}>
                            <Button variant="contained" onClick={handleSave}>Gravar</Button>
                            <Button variant="outlined" onClick={() => setOpenModal(false)}>Cancelar</Button>
                        </Box>
                    </BaseCard>
                </Box>
            </Modal>
        </Box>
    );
}
