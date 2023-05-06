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

import { showRoom } from '../../../store/ducks/rooms';
import { turnModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editRoomFetch, addRoomFetch } from '../../../store/fetchActions/rooms';
import AlertModal from '../../messagesModal';
import Select from '../../inputs/selects';
import { getAllServices } from '../../../store/fetchActions/service_calls';

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

export default function RoomModal(props) {


    const [form, setForm] = useState({
        name: "",
        description: "",
        status: "",
        call_service_id: ""
    });

    const { name, description, status, call_service_id } = form;
    const { room } = useSelector(state => state.rooms);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();
    const { services } = useSelector(state => state.services);

    const [texto, setTexto] = useState();

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            name: "",
            description: "",
            status: "",
            call_service_id: ""
        });
        setTexto('');
        dispatch(turnModal());
        dispatch(showRoom({}));
    }


    const handleSaveData = async () => {
        room && room.id ? handlePutData() : handlePostData()
    }

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`A sala foi Cadastrado com sucesso!`));
        dispatch(addRoomFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`A sala ${form.name} foi atualizado com sucesso!`));
        dispatch(editRoomFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    useEffect(() => {
        if (room && room.id)
            setForm(room);

    }, [room]);

    useEffect(() => {
        dispatch(getAllServices());
    }, []);

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
                            <BaseCard title={room && room.id ? "Editar Serviço " : "Enviar Serviço "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>
                                    <TextField
                                        label={name && name.length > 0 ? `Remetente: ${50 - name.length} caracteres restantes` : 'Nome'}
                                        variant="outlined"
                                        name="name"
                                        value={name ? name : ''}
                                        onChange={changeItem}
                                        required
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase",
                                            },
                                            maxLength: 50
                                        }}
                                    />

                                    <TextField
                                        id="description"
                                        label={description && description.length > 0 ? `Resumo: ${200 - description.length} caracteres restantes` : 'Descrição'}
                                        multiline
                                        rows={2}
                                        value={description ? description : ''}
                                        name="description"
                                        onChange={changeItem}
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            },
                                            maxLength: 200
                                        }}
                                    />

                                    <Select value={status}
                                        label={'Status'}
                                        name={'status'}
                                        store={[
                                            {
                                                "id": "OPEN",
                                                "name": "ABERTO"
                                            },
                                            {
                                                "id": "BUSY",
                                                "name": "OCUPADO"
                                            },
                                            {
                                                "id": "CLOSED",
                                                "name": "FECHADO"
                                            },
                                        ]}
                                        // getAllSelects={getAllStatusToSelect}
                                        changeItem={changeItem}
                                    />

                                    <Select value={call_service_id}
                                        label={'Serviço'}
                                        name={'call_service_id'}
                                        store={services}
                                        // getAllSelects={getAllStatusToSelect}
                                        changeItem={changeItem}
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