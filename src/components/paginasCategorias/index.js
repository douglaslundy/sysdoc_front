import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, FormControlLabel, Stack, Switch, Table, TableBody,
    TableCell, TableHead, TableRow, TextField, Typography, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import {
    getAllPageCategories, addPageCategoryFetch, editPageCategoryFetch, removePageCategoryFetch,
} from '../../store/fetchActions/accessProfiles';
import AlertModal from '../messagesModal';
import BaseCard from '../baseCard/BaseCard';

const FORM_INICIAL = { nome: '', icone: '', ordem: 999, ativo: true };
const ICONES = [
    'home', 'pie-chart', 'user', 'users', 'shield', 'bar-chart-2',
    'thermometer', 'clipboard', 'tag', 'user-check', 'calendar',
    'award', 'layers', 'truck', 'map', 'map-pin', 'send', 'file-text',
    'cpu', 'tool', 'grid', 'monitor', 'activity', 'plus-circle', 'layout',
    'alert-triangle', 'maximize', 'settings', 'lock', 'key', 'log-in', 'package', 'check-square',
];

export default function PaginasCategorias() {
    const dispatch = useDispatch();
    const { pageCategories } = useSelector(state => state.accessProfiles);

    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [busca, setBusca] = useState('');

    useEffect(() => {
        dispatch(getAllPageCategories());
    }, []);

    const salvar = () => {
        const payload = { ...form, ordem: Number(form.ordem || 999) };
        if (editId) {
            dispatch(editPageCategoryFetch(editId, payload, () => {
                setEditId(null);
                setForm(FORM_INICIAL);
                dispatch(getAllPageCategories());
            }));
        } else {
            dispatch(addPageCategoryFetch(payload, () => {
                setForm(FORM_INICIAL);
                dispatch(getAllPageCategories());
            }));
        }
    };

    const editar = (cat) => {
        setEditId(cat.id);
        setForm({
            nome: cat.nome || '',
            icone: cat.icone || '',
            ordem: cat.ordem ?? 999,
            ativo: !!cat.ativo,
        });
    };

    const categoriasFiltradas = [...pageCategories]
        .filter(cat =>
            (cat.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
            (cat.icone || '').toLowerCase().includes(busca.toLowerCase())
        )
        .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));

    return (
        <BaseCard title="Categorias de Páginas do Sistema">
            <AlertModal />
            <Stack spacing={2}>
                <TextField
                    className="lg-search-field"
                    placeholder="Buscar por nome ou ícone..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    inputProps={{ maxLength: 80 }}
                    sx={{ maxWidth: 420 }}
                />
                <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr 1fr 1fr auto auto' }}>
                    <TextField className="lg-search-field" placeholder="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                    <FormControl fullWidth>
                        <InputLabel>Ícone</InputLabel>
                        <Select
                            name="icone"
                            value={form.icone}
                            label="Ícone"
                            onChange={e => setForm(f => ({ ...f, icone: e.target.value }))}
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
                    <TextField className="lg-search-field" label="Ordem" type="number" value={form.ordem} onChange={e => setForm(f => ({ ...f, ordem: e.target.value }))} />
                    <FormControlLabel control={<Switch checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />} label="Ativa" />
                    <Button variant="contained" onClick={salvar}>{editId ? 'Atualizar' : 'Criar'}</Button>
                    {editId && <Button variant="outlined" onClick={() => { setEditId(null); setForm(FORM_INICIAL); }}>Cancelar</Button>}
                </Box>

                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nome</TableCell>
                            <TableCell>Ícone</TableCell>
                            <TableCell>Ordem</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categoriasFiltradas.map(cat => (
                            <TableRow key={cat.id}>
                                <TableCell><Typography variant="body2" fontWeight={600}>{cat.nome}</Typography></TableCell>
                                <TableCell>{cat.icone || '—'}</TableCell>
                                <TableCell>{cat.ordem ?? 999}</TableCell>
                                <TableCell><Chip size="small" label={cat.ativo ? 'Ativa' : 'Inativa'} color={cat.ativo ? 'success' : 'default'} /></TableCell>
                                <TableCell align="right">
                                    <Button size="small" onClick={() => editar(cat)}>Editar</Button>
                                    <Button size="small" color="error" onClick={() => dispatch(removePageCategoryFetch(cat.id))}>Remover</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {categoriasFiltradas.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography color="text.secondary">Nenhuma categoria encontrada</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Stack>
        </BaseCard>
    );
}

