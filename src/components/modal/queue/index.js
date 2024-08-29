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
import { editQueueFetch, addQueueFetch } from '../../../store/fetchActions/queues';
import AlertModal from '../../messagesModal';
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
        client: "",
        date_of_received: "",
        speciality: "",
        urgency: false,
        obs: "",
    });

    const { date_of_received, speciality, obs } = form;
    const { queue } = useSelector(state => state.queues);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();
    const { clients } = useSelector(state => state.clients);
    const { specialities } = useSelector(state => state.specialities);

    const [cli, setClient] = useState([]);

    const [texto, setTexto] = useState();


    const handleIsUrgency = () => {
        setForm({ ...form, urgency: !form.urgency })
    }

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const handleSetDn = (value) => {
        setForm({ ...form, date_of_received: value })
    }

    const cleanForm = () => {
        setForm({
            client: "",
            date_of_received: "",
            speciality: "",
            urgency: false,
            obs: "",
            setClient: {}
        });
        setTexto('');
        dispatch(turnModal());
        dispatch(showQueue({}));
    }


    const handleSaveData = async () => {
        queue && queue.id ? handlePutData() : handlePostData()
    }

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`A especialidade foi inserida com sucesso na fila!`));
        dispatch(addQueueFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`A especialidade foi atualizada com sucesso!`));
        dispatch(editQueueFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    useEffect(() => {
        if (queue && queue.id)
            setForm(queue);

    }, [queue]);


    useEffect(() => {
        setForm({
            ...form,
            client: cli.id
        })
    }, [cli]);



    useEffect(() => {
        if (isOpenModal === true) {
            dispatch(getAllClients());
            dispatch(getAllSpecialities());
            // setFormSale({ ...formSale, id_client: null, id_user: null });
        }

        if (isOpenModal === false) {
            setClient({});
            // cleanForm();
        }

    }, [isOpenModal]);

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
                            <BaseCard title={queue && queue.id ? "Editar Fila " : "Cadastrar na Fila "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>


                                    {
                                        isOpenModal &&
                                        <BasicDatePicker
                                            label="Data em que recebeu pedido"
                                            name="date_of_received, "
                                            value={date_of_received}
                                            setValue={handleSetDn}
                                            required
                                            sx={{ width: '22%', mr: 2 }}
                                        />
                                    }
                                    {
                                        isOpenModal &&

                                        <InputSelectClient
                                            id="client"
                                            label="Selecione o cliente"
                                            name="client"
                                            clients={clients}
                                            setClient={setClient}
                                            wd={"100%"}
                                        />

                                    }
                                    <Select
                                        value={speciality}
                                        label={'Especialidade'}
                                        name={'speciality'}
                                        store={specialities}
                                        changeItem={changeItem}
                                    />

                                    <FormGroup>
                                        <FormControlLabel control={<Switch checked={form.urgency}
                                            onClick={handleIsUrgency} />} label={form.urgency ? "Está como Urgente" : "Não está como urgente"} />
                                    </FormGroup>

                                    <TextField
                                        id="Obs"
                                        label={obs && obs.length > 0 ? `Observações: ${200 - obs.length} caracteres restantes` : 'Observações'}
                                        multiline
                                        rows={2}
                                        value={obs ? obs : ''}
                                        name="obs"
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
        </div>
    );
}