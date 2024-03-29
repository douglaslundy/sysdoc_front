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
} from "@mui/material";

import BaseCard from "../../baseCard/BaseCard";

import { showService } from '../../../store/ducks/service_calls';
import { turnModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { getAllServices } from '../../../store/fetchActions/service_calls';
import AlertModal from '../../messagesModal'
import Select from '../../inputs/selects';
import InputSelect from "../../inputs/inputSelect";
import { addCallFetch, editCallFetch } from '../../../store/fetchActions/calls';
import { getAllClients } from '../../../store/fetchActions/clients';
import { useRouter } from 'next/router';


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

export default function CreateCallModal(props) {


    const [form, setForm] = useState({
        call_service_id: "",
        client_id: "",
        subject: ""
    });

    const { call_service_id, client_id, subject } = form;
    const { services, service } = useSelector(state => state.services);
    const { call } = useSelector(state => state.calls);
    const { clients, client } = useSelector(state => state.clients);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const [texto, setTexto] = useState();
    const [customer, setCustomer] = useState();

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };
    const router = useRouter();

    const cleanForm = () => {
        setForm({
            call_service_id: "",
            client_id: "",
            subject: ""
        });
        setTexto('');
        dispatch(turnModal());
        dispatch(showService({}));
    }


    const handleGoClient = async () => {
        cleanForm();
        router.push('/clients');
    }
    const handleSaveData = async () => {
        call && call.id ? handlePutData() : handlePostData()
    }

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`Atendimento criado com sucesso!`));
        dispatch(addCallFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`Atendimento atualizado com sucesso!`));
        dispatch(editCallFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    // useEffect(() => {
    //     if (service && service.id)
    //         setForm(service);

    // }, [service]);

    useEffect(() => {
        dispatch(getAllServices());
    }, []);

    useEffect(() => {
        dispatch(getAllClients());
    }, []);

    useEffect(() => {
        if (isOpenModal) {
            setForm({
                ...call
            });
        }

    }, [call, isOpenModal]);

    useEffect(() => {

        if (customer?.id && customer.id != 'undefined') {

            setForm({
                ...form,
                client_id: customer?.id,
            });
        }

    }, [customer])

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
                            <BaseCard title={call && call.id ? "Editar Atendimento " : "Novo Atendimento "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <br />

                                <Stack spacing={3}>

                                    <InputSelect
                                        label="Selecione o Cliente"
                                        name="client_id"
                                        data={clients}
                                        setData={setCustomer}
                                        state={isOpenModal}
                                    // wd={"100%"}
                                    />

                                    <Select
                                        label={'Serviço'}
                                        value={call_service_id}
                                        name={'call_service_id'}
                                        store={services}
                                        disabled={call?.id ? true : false}
                                        changeItem={changeItem}
                                    />

                                    <TextField
                                        id="subject"
                                        label={subject && subject.length > 0 ? `Resumo: ${200 - subject.length} caracteres restantes` : 'Motivo do atendimento'}
                                        multiline
                                        rows={2}
                                        value={subject ? subject : ''}
                                        name="subject"
                                        disabled={call?.id ? true : false}
                                        onChange={changeItem}
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            },
                                            maxLength: 200
                                        }}
                                    />
                                </Stack>

                                <br />
                                <Box sx={{ "& button": { mx: 1 } }}>

                                    <Button onClick={handleSaveData} variant="contained" mt={2}>
                                        Gravar
                                    </Button>
                                    
                                    <Button onClick={handleGoClient} color='success' variant="contained" mt={2}>
                                        Cadastrar Cliente
                                    </Button>

                                    <Button onClick={cleanForm} variant="outlined" mt={2}>
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