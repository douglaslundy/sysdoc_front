import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { Grid, Stack, TextField, Button, FormControlLabel, Switch } from '@mui/material';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import { showCategoria } from '../../../store/ducks/categoriasExame';
import { turnModal } from '../../../store/ducks/Layout';
import { addCategoriaFetch, editCategoriaFetch } from '../../../store/fetchActions/categoriasExame';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    height: '98%',
    bgcolor: 'background.paper',
    border: '0px solid #000',
    boxShadow: 24,
    p: 4,
    overflow: 'scroll',
};

const FORM_INICIAL = { nome: '', ativo: true };

export default function CategoriaExameModal(props) {
    const dispatch = useDispatch();
    const { categoria } = useSelector(state => state.categoriasExame);
    const { isOpenModal } = useSelector(state => state.layout);

    const [form, setForm] = useState(FORM_INICIAL);

    const isEdit = !!(categoria && categoria.id);

    const cleanForm = () => {
        setForm(FORM_INICIAL);
        dispatch(turnModal());
        dispatch(showCategoria({}));
    };

    const handleSave = () => {
        if (isEdit) {
            dispatch(editCategoriaFetch(categoria.id, form, cleanForm));
        } else {
            dispatch(addCategoriaFetch(form, cleanForm));
        }
    };

    useEffect(() => {
        if (categoria && categoria.id) {
            setForm({ nome: categoria.nome || '', ativo: categoria.ativo ?? true });
        } else {
            setForm(FORM_INICIAL);
        }
    }, [categoria]);

    return (
        <div>
            {props.children}
            <Modal keepMounted open={isOpenModal} onClose={cleanForm}>
                <Box sx={style}>
                    <AlertModal />
                    <Grid container spacing={0}>
                        <Grid item xs={12}>
                            <BaseCard title={isEdit ? 'Editar Categoria' : 'Nova Categoria de Exame'}>
                                <Stack spacing={3}>
                                    <TextField
                                        label="Nome da Categoria"
                                        name="nome"
                                        value={form.nome}
                                        onChange={({ target }) => setForm(f => ({ ...f, nome: target.value }))}
                                        required
                                        inputProps={{ maxLength: 80, style: { textTransform: 'uppercase' }, autoComplete: 'off' }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.ativo}
                                                onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                                            />
                                        }
                                        label="Categoria ativa"
                                    />
                                </Stack>
                                <br />
                                <Box sx={{ '& button': { mx: 1 } }}>
                                    <Button variant="contained" onClick={handleSave}>
                                        Gravar
                                    </Button>
                                    <Button variant="outlined" onClick={cleanForm}>
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
