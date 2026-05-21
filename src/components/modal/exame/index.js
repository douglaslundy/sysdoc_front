import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import {
    Grid, Stack, TextField, Button, FormControlLabel, Switch,
    FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import { showExame } from '../../../store/ducks/exames';
import { turnModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { addExameFetch, editExameFetch } from '../../../store/fetchActions/exames';
import { getAllCategorias } from '../../../store/fetchActions/categoriasExame';
import {
    modalBackdropSx,
    modalFormRootSx,
    modalPrimaryButtonSx,
    modalSecondaryButtonSx,
    modalShellSx,
} from '../_shared/modalFormStyles';

const FORM_INICIAL = { nome: '', codigo: '', categoria_exame_id: '', descricao: '', ativo: true };

export default function ExameModal(props) {
    const dispatch = useDispatch();
    const router = useRouter();
    const { exame } = useSelector(state => state.exames);
    const { isOpenModal } = useSelector(state => state.layout);
    const { categorias } = useSelector(state => state.categoriasExame);

    const [form, setForm] = useState(FORM_INICIAL);

    const isEdit = !!(exame && exame.id);

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const cleanForm = () => {
        setForm(FORM_INICIAL);
        dispatch(turnModal());
        dispatch(showExame({}));
    };

    const handleSave = () => {
        if (isEdit) {
            dispatch(changeTitleAlert(`Exame ${form.nome} atualizado com sucesso!`));
            dispatch(editExameFetch(exame.id, form, cleanForm));
        } else {
            dispatch(changeTitleAlert(`Exame ${form.nome} criado com sucesso!`));
            dispatch(addExameFetch(form, (saved) => {
                dispatch(turnModal());
                dispatch(showExame({}));
                router.push(`/laboratorio/exames/${saved.id}/campos`);
            }));
        }
    };

    useEffect(() => {
        dispatch(getAllCategorias({ all: true }));
    }, []);

    useEffect(() => {
        if (exame && exame.id) {
            setForm({
                nome:               exame.nome || '',
                codigo:             exame.codigo || '',
                categoria_exame_id: exame.categoria_exame_id || '',
                descricao:          exame.descricao || '',
                ativo:              exame.ativo ?? true,
            });
        } else {
            setForm(FORM_INICIAL);
        }
    }, [exame]);

    const categoriasAtivas = categorias.filter(c => c.ativo);

    return (
        <div>
            {props.children}
            <Modal
                keepMounted
                open={isOpenModal}
                onClose={cleanForm}
                slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
                <Box sx={{ ...modalShellSx, ...modalFormRootSx }}>
                    <AlertModal />
                    <Grid container spacing={0}>
                        <Grid item xs={12}>
                            <BaseCard title={isEdit ? 'Editar Exame' : 'Novo Exame'}>
                                <Stack spacing={3}>
                                    <TextField
                                        label="Nome do Exame"
                                        name="nome"
                                        value={form.nome}
                                        onChange={change}
                                        required
                                        inputProps={{ maxLength: 100, style: { textTransform: 'uppercase' } }}
                                    />
                                    <Box display="flex" gap={2}>
                                        <TextField
                                            label="Código"
                                            name="codigo"
                                            value={form.codigo}
                                            onChange={change}
                                            required
                                            inputProps={{ maxLength: 30, style: { textTransform: 'uppercase' } }}
                                            sx={{ flex: 1 }}
                                        />
                                        <FormControl sx={{ flex: 2 }}>
                                            <InputLabel>Categoria</InputLabel>
                                            <Select
                                                name="categoria_exame_id"
                                                value={form.categoria_exame_id}
                                                label="Categoria"
                                                onChange={change}
                                            >
                                                <MenuItem value=""><em>Sem categoria</em></MenuItem>
                                                {categoriasAtivas.map(c => (
                                                    <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    <TextField
                                        label="Descrição"
                                        name="descricao"
                                        value={form.descricao}
                                        onChange={change}
                                        multiline
                                        rows={3}
                                        inputProps={{ maxLength: 500 }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.ativo}
                                                onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                                            />
                                        }
                                        label="Exame ativo"
                                    />
                                </Stack>
                                <Box sx={{ display: 'flex', gap: 1, mt: 2.2 }}>
                                    <Button variant="contained" onClick={handleSave} sx={modalPrimaryButtonSx}>
                                        {isEdit ? 'Salvar' : 'Criar e gerenciar campos'}
                                    </Button>
                                    <Button variant="outlined" onClick={cleanForm} sx={modalSecondaryButtonSx}>
                                        Cancelar
                                    </Button>
                                </Box>
                            </BaseCard>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>
        </div>
    );
}
