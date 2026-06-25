import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import { modalFormRootSx, modalSecondaryButtonSx, modalShellSx } from '../../_shared/modalFormStyles';
import Modal from '@mui/material/Modal';
import BaseCard from '../../../baseCard/BaseCard';
import { parseISO, format } from "date-fns";
import {
    Alert,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Button,
    Typography,
} from "@mui/material";
import { showLetter } from '../../../../store/ducks/letters';
import { turnModalViewLetter } from '../../../../store/ducks/Layout';
import { api } from '../../../../services/api';

export default function ViewLetterModal(props) {

    const [lett, setLett] = useState({
        sender: "",
        recipient: "",
        subject_matter: "",
        obs: "",
        summary: "",
        created_at: ""
    });

    const { sender, recipient, subject_matter, obs, summary, created_at } = lett;
    const { letter } = useSelector(state => state.letters);
    const { isOpenLetterModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();
    const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [destinationUserId, setDestinationUserId] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [creatingProtocol, setCreatingProtocol] = useState(false);
    const [protocolFeedback, setProtocolFeedback] = useState(null);

    const cleanLett = () => {
        setLett({
            sender: "",
            recipient: "",
            subject_matter: "",
            obs: "",
            summary: "",
            created_at: ""
        });
        dispatch(turnModalViewLetter());
        dispatch(showLetter({}));
        setProtocolDialogOpen(false);
        setDestinationUserId('');
        setProtocolFeedback(null);
    }

    const handleClose = () => {
        cleanLett();
    };

    useEffect(() => {
        if (letter && letter.id)
            setLett(letter);

    }, [letter]);

    const openProtocolDialog = async () => {
        setProtocolDialogOpen(true);
        setProtocolFeedback(null);
        if (users.length > 0) return;

        setLoadingUsers(true);
        try {
            const { data } = await api.get('/users');
            setUsers((Array.isArray(data) ? data : []).filter(user => user.active));
        } catch (error) {
            setProtocolFeedback({
                type: 'error',
                message: error?.response?.data?.message || 'Não foi possível carregar os destinatários.',
            });
        } finally {
            setLoadingUsers(false);
        }
    };

    const createProtocol = async () => {
        if (!destinationUserId) {
            setProtocolFeedback({ type: 'error', message: 'Selecione o destinatário do protocolo.' });
            return;
        }

        setCreatingProtocol(true);
        setProtocolFeedback(null);
        try {
            const { data } = await api.post(`/letters/${letter.id}/protocol`, {
                destino_user_id: destinationUserId,
            });
            setProtocolFeedback({
                type: 'success',
                message: `${data?.message || 'Protocolo criado com sucesso.'} Número: ${data?.protocol?.numero || '-'}`,
            });
            setDestinationUserId('');
        } catch (error) {
            setProtocolFeedback({
                type: 'error',
                message: error?.response?.data?.message || 'Não foi possível criar o protocolo.',
            });
        } finally {
            setCreatingProtocol(false);
        }
    };


    return (
        <div>
            {props.children}
            <Modal
                keepMounted
                open={isOpenLetterModal}
                onClose={handleClose}
                aria-labelledby="keep-mounted-modal-title"
                aria-describedby="keep-mounted-modal-description"
            >
                <Box sx={{ ...modalShellSx, ...modalFormRootSx }}>

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={letter && letter.id ? "Ofício  " + letter.number : "você não selecionou um ofício válido"}>

                                <Stack spacing={3}>
                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Remetente
                                        </Typography>
                                        <Typography
                                            // color="textSecondary"
                                            sx={{
                                                fontSize: "14px",
                                            }}
                                        >
                                            {sender ? sender.toUpperCase() : ''}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Destinatário
                                        </Typography>
                                        <Typography
                                            // color="textSecondary"
                                            sx={{
                                                fontSize: "14px",
                                            }}
                                        >
                                            {recipient ? recipient.toUpperCase() : ''}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Assunto
                                        </Typography>
                                        <Typography
                                            // color="textSecondary"
                                            sx={{
                                                fontSize: "14px",
                                            }}
                                        >
                                            {subject_matter ? subject_matter.toUpperCase() : ''}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Resumo
                                        </Typography>
                                        <Typography
                                            // color="textSecondary"
                                            sx={{
                                                fontSize: "14px",
                                            }}
                                        >
                                            {summary ? summary.toUpperCase() : ''}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Modelo Criado com Inteligência Artificial
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: "16px",
                                            }}
                                        >
                                           {obs ? obs : ''}
                                           {/* <pre> {obs ? obs : ''}</pre> */}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                                textAlign: "right"
                                            }}
                                        >
                                            {letter && letter.user && letter.user.name}
                                        </Typography>

                                        <Typography
                                            variant="h6"
                                            sx={{
                                                textAlign: "right"
                                            }}
                                        >
                                            {created_at && format(parseISO(created_at), 'dd/MM/yyyy HH:mm:ss')}
                                        </Typography>
                                    </Box>

                                    
                                </Stack>
                                <br />
                                <Box sx={{ mt: 2.2, display: 'flex', justifyContent: 'flex-end', gap: 1.2, flexWrap: 'wrap' }}>
                                    <Button onClick={openProtocolDialog} variant="contained">
                                        Criar protocolo
                                    </Button>
                                    <Button onClick={() => { cleanLett() }} variant="outlined" sx={modalSecondaryButtonSx}>
                                        Voltar
                                    </Button>
                                </Box>
                            </BaseCard>
                        </Grid>
                    </Grid>

                </Box>
            </Modal>

            <Dialog
                open={protocolDialogOpen}
                onClose={() => !creatingProtocol && setProtocolDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Criar protocolo pelo Ofício {letter?.number}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            O ofício será convertido em PDF, anexado ao protocolo e enviado ao usuário selecionado.
                        </Typography>
                        <FormControl fullWidth disabled={loadingUsers || creatingProtocol}>
                            <InputLabel id="letter-protocol-destination-label">Destinatário</InputLabel>
                            <Select
                                labelId="letter-protocol-destination-label"
                                label="Destinatário"
                                value={destinationUserId}
                                onChange={(event) => setDestinationUserId(event.target.value)}
                            >
                                {users.map(user => (
                                    <MenuItem key={user.id} value={user.id}>
                                        {user.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {loadingUsers && <CircularProgress size={24} />}
                        {protocolFeedback && (
                            <Alert severity={protocolFeedback.type}>{protocolFeedback.message}</Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        onClick={() => setProtocolDialogOpen(false)}
                        disabled={creatingProtocol}
                        sx={modalSecondaryButtonSx}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={createProtocol}
                        disabled={creatingProtocol || loadingUsers}
                    >
                        {creatingProtocol ? 'Criando...' : 'Criar protocolo'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}




