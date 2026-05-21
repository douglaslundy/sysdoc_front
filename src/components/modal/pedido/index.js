import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
    Grid, Stack, TextField, Button, FormControl, InputLabel, Select,
    MenuItem, Divider, Typography, Checkbox, FormControlLabel, Chip,
    Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import BasicDatePicker from '../../inputs/datePicker';
import { closeModal } from '../../../store/ducks/Layout';
import { addPedidoFetch } from '../../../store/fetchActions/pedidosExame';
import { getAllExames } from '../../../store/fetchActions/exames';
import { getAllMedicos } from '../../../store/fetchActions/medicosSolicitantes';
import { api } from '../../../services/api';
import {
    modalBackdropSx,
    modalFormRootSx,
    modalPrimaryButtonSx,
    modalSecondaryButtonSx,
    modalShellSx,
} from '../_shared/modalFormStyles';

const FORM_INICIAL = {
    client_id: '',
    medico_solicitante_id: '',
    data_pedido: new Date().toISOString().split('T')[0],
    data_coleta: '',
    observacoes: '',
    exames: [],
};

export default function PedidoModal(props) {
    const dispatch = useDispatch();
    const { isOpenModal } = useSelector(state => state.layout);
    const { exames } = useSelector(state => state.exames);
    const { medicos } = useSelector(state => state.medicosSolicitantes);

    const [form, setForm] = useState(FORM_INICIAL);
    const [busca, setBusca] = useState('');
    const [cpfCns, setCpfCns] = useState('');
    const [paciente, setPaciente] = useState(null);
    const [buscandoPaciente, setBuscandoPaciente] = useState(false);
    const [erroPaciente, setErroPaciente] = useState('');
    const [credenciais, setCredenciais] = useState(null);

    useEffect(() => {
        if (isOpenModal) {
            dispatch(getAllExames({ ativo: true, per_page: 200 }));
            dispatch(getAllMedicos({ all: true, ativo: true }));
        }
    }, [isOpenModal]);

    const buscarPaciente = async () => {
        const termo = cpfCns.replace(/\D/g, '');
        if (termo.length < 6) {
            setErroPaciente('Informe ao menos 6 dígitos do CPF ou CNS.');
            return;
        }
        setBuscandoPaciente(true);
        setErroPaciente('');
        setPaciente(null);
        try {
            const res = await api.get('/clients/buscar-cpf-cns', { params: { q: termo } });
            setPaciente(res.data);
            setForm(f => ({ ...f, client_id: res.data.id }));
        } catch (err) {
            setErroPaciente(err.response?.data?.message || 'Paciente não encontrado.');
            setForm(f => ({ ...f, client_id: '' }));
        } finally {
            setBuscandoPaciente(false);
        }
    };

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

    const medicosAtivos = medicos.filter(m => m.ativo);

    const cleanForm = () => {
        setForm({ ...FORM_INICIAL, data_pedido: new Date().toISOString().split('T')[0] });
        setBusca('');
        setCpfCns('');
        setPaciente(null);
        setErroPaciente('');
        dispatch(closeModal());
    };

    const handleSave = () => {
        dispatch(addPedidoFetch(form, (_pedido, protocolo, senha) => {
            setCredenciais({ protocolo, senha });
        }));
    };

    const handleFecharCredenciais = () => {
        setCredenciais(null);
        cleanForm();
    };

    return (
        <div>
            <Dialog open={!!credenciais} onClose={handleFecharCredenciais} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FeatherIcon icon="check-circle" color="#4caf50" size={22} />
                    Pedido Criado — Credenciais de Acesso
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Anote a senha agora. Ela não poderá ser recuperada depois.
                    </Alert>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Protocolo</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                <Chip
                                    label={credenciais?.protocolo}
                                    color="success"
                                    sx={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 1, px: 1 }}
                                />
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Senha de Acesso</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                <Chip
                                    label={credenciais?.senha}
                                    color="warning"
                                    sx={{ fontSize: 20, fontWeight: 'bold', letterSpacing: 4, px: 1 }}
                                />
                            </Box>
                        </Box>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Entregue estas credenciais ao paciente para que ele possa consultar o resultado do exame online.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={handleFecharCredenciais}>
                        Entendi, fechar
                    </Button>
                </DialogActions>
            </Dialog>

            {props.children}
            <Modal keepMounted open={isOpenModal} onClose={cleanForm} slotProps={{ backdrop: { sx: modalBackdropSx } }}>
                <Box sx={{ ...modalShellSx, ...modalFormRootSx }}>
                    <AlertModal />
                    <Grid container spacing={0}>
                        <Grid item xs={12}>
                            <BaseCard title="Novo Pedido de Exame">
                                <Stack spacing={3}>
                                    {/* Busca de paciente por CPF/CNS */}
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>Buscar Paciente</Typography>
                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                            <TextField
                                                label="CPF ou CNS do paciente"
                                                value={cpfCns}
                                                onChange={e => setCpfCns(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && buscarPaciente()}
                                                size="medium"
                                                sx={{
                                                    flex: 1,
                                                    '& .MuiInputBase-root': { minHeight: 44 },
                                                    '& .MuiInputBase-input': { paddingTop: '11px', paddingBottom: '11px' },
                                                }}
                                                inputProps={{ maxLength: 20, autoComplete: 'off' }}
                                                InputProps={{
                                                    endAdornment: buscandoPaciente ? (
                                                        <InputAdornment position="end">
                                                            <CircularProgress size={18} />
                                                        </InputAdornment>
                                                    ) : null,
                                                }}
                                            />
                                            <Button
                                                variant="outlined"
                                                onClick={buscarPaciente}
                                                disabled={buscandoPaciente}
                                                startIcon={<FeatherIcon icon="search" size={16} />}
                                            >
                                                Buscar
                                            </Button>
                                        </Stack>
                                        {erroPaciente && (
                                            <Alert severity="warning" sx={{ mt: 1 }}>{erroPaciente}</Alert>
                                        )}
                                        {paciente && (
                                            <Alert severity="success" sx={{ mt: 1 }}
                                                action={
                                                    <IconButton size="small" onClick={() => { setPaciente(null); setCpfCns(''); setForm(f => ({ ...f, client_id: '' })); }}>
                                                        <FeatherIcon icon="x" size={14} />
                                                    </IconButton>
                                                }
                                            >
                                                <strong>{paciente.name}</strong>
                                                {paciente.cpf && ` — CPF: ${paciente.cpf}`}
                                                {paciente.cns && ` — CNS: ${paciente.cns}`}
                                            </Alert>
                                        )}
                                    </Box>

                                    <FormControl fullWidth>
                                        <InputLabel>Médico Solicitante</InputLabel>
                                        <Select
                                            name="medico_solicitante_id"
                                            value={form.medico_solicitante_id}
                                            label="Médico Solicitante"
                                            onChange={change}
                                        >
                                            <MenuItem value=""><em>Nenhum</em></MenuItem>
                                            {medicosAtivos.map(m => (
                                                <MenuItem key={m.id} value={m.id}>
                                                    {m.nome}{m.crm ? ` — CRM ${m.crm}${m.uf_crm ? '/' + m.uf_crm : ''}` : ''}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

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
                                <Box sx={{ display: 'flex', gap: 1, mt: 2.2 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSave}
                                        disabled={!form.client_id || form.exames.length === 0}
                                        sx={modalPrimaryButtonSx}
                                    >
                                        Criar Pedido
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
