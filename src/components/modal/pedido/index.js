import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import {
    Grid, Stack, TextField, Button, FormControl, InputLabel, Select,
    MenuItem, Divider, Typography, Checkbox, FormControlLabel, Chip,
} from '@mui/material';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import BasicDatePicker from '../../inputs/datePicker';
import { turnModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { addPedidoFetch } from '../../../store/fetchActions/pedidosExame';
import { getAllExames } from '../../../store/fetchActions/exames';

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

const FORM_INICIAL = {
    client_id: '',
    medico_solicitante: '',
    data_pedido: new Date().toISOString().split('T')[0],
    data_coleta: '',
    observacoes: '',
    exames: [],
};

export default function PedidoModal(props) {
    const dispatch = useDispatch();
    const { isOpenModal } = useSelector(state => state.layout);
    const { clients } = useSelector(state => state.clients);
    const { exames } = useSelector(state => state.exames);

    const [form, setForm] = useState(FORM_INICIAL);
    const [busca, setBusca] = useState('');

    useEffect(() => {
        if (isOpenModal) {
            dispatch(getAllClients());
            dispatch(getAllExames({ ativo: true, per_page: 100 }));
        }
    }, [isOpenModal]);

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const toggleExame = (exameId) => {
        setForm(f => ({
            ...f,
            exames: f.exames.includes(exameId)
                ? f.exames.filter(id => id !== exameId)
                : [...f.exames, exameId],
        }));
    };

    const examesFiltrados = exames.filter(e =>
        e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        e.codigo?.toLowerCase().includes(busca.toLowerCase())
    );

    const cleanForm = () => {
        setForm({ ...FORM_INICIAL, data_pedido: new Date().toISOString().split('T')[0] });
        setBusca('');
        dispatch(turnModal());
    };

    const handleSave = () => {
        dispatch(changeTitleAlert('Pedido de exame criado com sucesso!'));
        dispatch(addPedidoFetch(form, cleanForm));
    };

    return (
        <div>
            {props.children}
            <Modal keepMounted open={isOpenModal} onClose={cleanForm}>
                <Box sx={style}>
                    <AlertModal />
                    <Grid container spacing={0}>
                        <Grid item xs={12}>
                            <BaseCard title="Novo Pedido de Exame">
                                <Stack spacing={3}>
                                    <FormControl required fullWidth>
                                        <InputLabel>Paciente</InputLabel>
                                        <Select name="client_id" value={form.client_id} label="Paciente" onChange={change}>
                                            {clients.map(c => (
                                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        label="Médico Solicitante"
                                        name="medico_solicitante"
                                        value={form.medico_solicitante}
                                        onChange={change}
                                        inputProps={{ maxLength: 100 }}
                                    />

                                    <Box display="flex" gap={2}>
                                        <BasicDatePicker
                                            label="Data do Pedido"
                                            name="data_pedido"
                                            value={form.data_pedido}
                                            setValue={(v) => setForm(f => ({ ...f, data_pedido: v ? v.toISOString().split('T')[0] : '' }))}
                                            sx={{ flex: 1 }}
                                        />
                                        <BasicDatePicker
                                            label="Data da Coleta"
                                            name="data_coleta"
                                            value={form.data_coleta}
                                            setValue={(v) => setForm(f => ({ ...f, data_coleta: v ? v.toISOString().split('T')[0] : '' }))}
                                            sx={{ flex: 1 }}
                                        />
                                    </Box>

                                    <TextField
                                        label="Observações"
                                        name="observacoes"
                                        value={form.observacoes}
                                        onChange={change}
                                        multiline
                                        rows={2}
                                        inputProps={{ maxLength: 500 }}
                                    />

                                    <Divider />
                                    <Typography variant="h6">Selecionar Exames</Typography>

                                    <TextField
                                        size="small"
                                        placeholder="Filtrar exames por nome ou código"
                                        value={busca}
                                        onChange={e => setBusca(e.target.value)}
                                    />

                                    <Box sx={{ maxHeight: 220, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                                        {examesFiltrados.map(exame => (
                                            <FormControlLabel
                                                key={exame.id}
                                                control={
                                                    <Checkbox
                                                        checked={form.exames.includes(exame.id)}
                                                        onChange={() => toggleExame(exame.id)}
                                                    />
                                                }
                                                label={
                                                    <Box>
                                                        <Typography>{exame.nome}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{exame.codigo}</Typography>
                                                    </Box>
                                                }
                                                sx={{ display: 'flex', mb: 0.5 }}
                                            />
                                        ))}
                                        {examesFiltrados.length === 0 && (
                                            <Typography color="text.secondary" p={1}>Nenhum exame encontrado</Typography>
                                        )}
                                    </Box>

                                    {form.exames.length > 0 && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {form.exames.length} exame(s) selecionado(s):
                                            </Typography>
                                            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                                {exames.filter(e => form.exames.includes(e.id)).map(e => (
                                                    <Chip key={e.id} label={e.codigo} size="small" onDelete={() => toggleExame(e.id)} />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Stack>
                                <br />
                                <Box sx={{ '& button': { mx: 1 } }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSave}
                                        disabled={!form.client_id || form.exames.length === 0}
                                    >
                                        Criar Pedido
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
