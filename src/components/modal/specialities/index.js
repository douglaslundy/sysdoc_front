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

import { showSpeciality } from '../../../store/ducks/specialities';
import { turnModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editSpecialityFetch, addSpecialityFetch } from '../../../store/fetchActions/specialities';
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

export default function SpecialityModal(props) {


    const [form, setForm] = useState({
        name: ""
    });

    const { name, description, status, call_service_id } = form;
    const { speciality } = useSelector(state => state.specialities);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();
    const { services } = useSelector(state => state.services);

    const [texto, setTexto] = useState();

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            name: ""
        });
        setTexto('');
        dispatch(turnModal());
        dispatch(showSpeciality({}));
    }


    const handleSaveData = async () => {
        speciality && speciality.id ? handlePutData() : handlePostData()
    }

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`A especialidade ${form.name} foi Cadastrado com sucesso!`));
        dispatch(addSpecialityFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`A especialidade ${form.name} foi atualizado com sucesso!`));
        dispatch(editSpecialityFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    useEffect(() => {
        if (speciality && speciality.id)
            setForm(speciality);

    }, [speciality]);

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
                            <BaseCard title={speciality && speciality.id ? "Editar Especialidade " : "Enviar Especialidade "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>

                                    <TextField
                                        label={name && name.length > 0 ? `Remetente: ${200 - name.length} caracteres restantes` : 'Nome da Especialidade'}
                                        variant="outlined"
                                        name="name"
                                        value={name ? name : ''}
                                        onChange={changeItem}
                                        required
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase",
                                            },
                                            maxLength: 50,
                                            autoComplete: "off", // Desativa o preenchimento automático
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