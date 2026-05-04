import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { Grid, Stack, TextField, Button, FormControlLabel, Switch } from '@mui/material';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import { showMedico } from '../../../store/ducks/medicosSolicitantes';
import { turnModal } from '../../../store/ducks/Layout';
import { addMedicoFetch, editMedicoFetch } from '../../../store/fetchActions/medicosSolicitantes';

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

const FORM_INICIAL = { nome: '', crm: '', uf_crm: '', especialidade: '', telefone: '', ativo: true };

export default function MedicoSolicitanteModal(props) {
    const dispatch = useDispatch();
    const { medico } = useSelector(state => state.medicosSolicitantes);
    const { isOpenModal } = useSelector(state => state.layout);

    const [form, setForm] = useState(FORM_INICIAL);

    const isEdit = !!(medico && medico.id);

    const cleanForm = () => {
        setForm(FORM_INICIAL);
        dispatch(turnModal());
        dispatch(showMedico({}));
    };

    const handleChange = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const handleSave = () => {
        if (isEdit) {
            dispatch(editMedicoFetch(medico.id, form, cleanForm));
        } else {
            dispatch(addMedicoFetch(form, cleanForm));
        }
    };

    useEffect(() => {
        if (medico && medico.id) {
            setForm({
                nome: medico.nome || '',
                crm: medico.crm || '',
                uf_crm: medico.uf_crm || '',
                especialidade: medico.especialidade || '',
                telefone: medico.telefone || '',
                ativo: medico.ativo ?? true,
            });
        } else {
            setForm(FORM_INICIAL);
        }
    }, [medico]);

    return (
        <div>
            {props.children}
            <Modal keepMounted open={isOpenModal} onClose={cleanForm}>
                <Box sx={style}>
                    <AlertModal />
                    <Grid container spacing={0}>
                        <Grid item xs={12}>
                            <BaseCard title={isEdit ? 'Editar Médico Solicitante' : 'Novo Médico Solicitante'}>
                                <Stack spacing={3}>
                                    <TextField
                                        label="Nome completo"
                                        name="nome"
                                        value={form.nome}
                                        onChange={handleChange}
                                        required
                                        inputProps={{ maxLength: 100, autoComplete: 'off' }}
                                    />
                                    <Stack direction="row" spacing={2}>
                                        <TextField
                                            label="CRM"
                                            name="crm"
                                            value={form.crm}
                                            onChange={handleChange}
                                            inputProps={{ maxLength: 20, autoComplete: 'off' }}
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            label="UF"
                                            name="uf_crm"
                                            value={form.uf_crm}
                                            onChange={e => setForm(f => ({ ...f, uf_crm: e.target.value.toUpperCase().slice(0, 2) }))}
                                            inputProps={{ maxLength: 2, autoComplete: 'off' }}
                                            sx={{ flex: 1 }}
                                        />
                                    </Stack>
                                    <TextField
                                        label="Especialidade"
                                        name="especialidade"
                                        value={form.especialidade}
                                        onChange={handleChange}
                                        inputProps={{ maxLength: 80, autoComplete: 'off' }}
                                    />
                                    <TextField
                                        label="Telefone"
                                        name="telefone"
                                        value={form.telefone}
                                        onChange={handleChange}
                                        inputProps={{ maxLength: 20, autoComplete: 'off' }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.ativo}
                                                onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                                            />
                                        }
                                        label="Médico ativo"
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
