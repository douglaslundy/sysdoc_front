import { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';

import {
    Grid,
    Stack,
    TextField,
    Alert,
    Button,
    FormGroup,
    FormControlLabel
} from "@mui/material";

import Switch from '@mui/material/Switch';

import BaseCard from "../../baseCard/BaseCard";

import { showQueue } from '../../../store/ducks/queues';
import { turnModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editDoneQueue, addQueueFetch } from '../../../store/fetchActions/queues';
import AlertModal from '../../messagesModal';
import ConfirmDialog from "../../confirmDialog";
import InputSelectClient from '../../inputs/inputSelectClient';
import { getAllClients } from '../../../store/fetchActions/clients';
import { getAllSpecialities } from '../../../store/fetchActions/specialities';
import Select from '../../inputs/selects';
import BasicDatePicker from '../../inputs/datePicker';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "90%",
    height: "98%",
    bgcolor: 'background.paper',
    border: '0px solid #000',
    boxShadow: 24,
    p: 4,
    overflow: "scroll",
};

export default function QueueModal(props) {


    const [form, setForm] = useState({
        date_of_realized: "",
    });

    const { date_of_realized, obsConclusion } = form;
    const { queue } = useSelector(state => state.queues);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();


    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja Realmente finalizar a especialidade',
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const [texto, setTexto] = useState('');


    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const handleSetDn = (value) => {
        setForm({ ...form, date_of_realized: value })
    }

    const cleanForm = () => {
        setForm({
            date_of_realized: "",
        });
        setTexto('');
        dispatch(turnModal());
        dispatch(showQueue({}));
    }


    const handleSaveData = async () => {
        queue && queue.id ? handlePutData() : null
    }

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`A especialidade foi atualizada com sucesso!`));
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente finalizar a especialidade ${queue.id}`, confirm: editDoneQueue(form, cleanForm) })
    };

    const handleClose = () => {
        cleanForm();
    };

    useEffect(() => {
        if (queue && queue.id)
            setForm(queue);

    }, [queue]);


    return (
        <div>
            {props.children}
            <Modal
                keepMounted
                open={isOpenModal}
                onClose={handleClose}
                aria-labelledby="keep-mounted-modal-title"
                aria-describedby="keep-mounted-modal-description"
            >
                <Box sx={style}>

                    <AlertModal />

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={queue && queue.id ? ` ${queue.id} - CLIENTE: ${queue?.client?.name} - ESPECIALIDADE: ${queue?.speciality?.name} ` : "Não foi encontrado nada aqui "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <h4>DESFECHO: Agendar ou Finalizar Este Cliente na Fila de Especialidade:</h4>
                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>


                                    {
                                        isOpenModal &&
                                        <BasicDatePicker
                                            label="Informe a data do desfecho"
                                            name="date_of_realized, "
                                            value={date_of_realized}
                                            setValue={handleSetDn}
                                            required
                                            sx={{ width: '22%', mr: 2 }}
                                        />
                                    }

                                </Stack>

                                <h4>OBS:</h4>
                                <Stack sx={{ m: 2 }}>
                                    {
                                        queue?.obs ? queue.obs : ''
                                    }
                                </Stack>

                                <Stack spacing={3}>
                                    <TextField
                                        id="Obs"
                                        label={obsConclusion && obsConclusion.length > 0 ? `Observações: ${200 - obsConclusion.length} caracteres restantes` : 'Observações'}
                                        multiline
                                        rows={2}
                                        value={obsConclusion ? obsConclusion : ''}
                                        name="obsConclusion"
                                        // disabled={queue?.id ? true : false}
                                        onChange={changeItem}
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            },
                                            maxLength: 200
                                        }}
                                    />

                                </Stack>
                                {/* </FormGroup> */}
                                <br />
                                <Box sx={{ "& button": { mx: 1 } }}>
                                    <Button onClick={handleSaveData} variant="contained" mt={2}>
                                        Gravar
                                    </Button>

                                    <Button onClick={() => { cleanForm() }} variant="outlined" mt={2}>
                                        Cancelar
                                    </Button>
                                </Box>
                            </BaseCard>
                        </Grid>
                    </Grid>

                </Box>
            </Modal>
            <ConfirmDialog
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog} />
        </div>
    );
}