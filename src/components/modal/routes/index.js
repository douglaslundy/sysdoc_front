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

import { showRoute } from '../../../store/ducks/routes';
import { closeModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editRouteFetch, addRouteFetch } from '../../../store/fetchActions/routes';
import { getAllStates } from '../../../store/fetchActions/states';
import AlertModal from '../../messagesModal';
import BasicSelect from '../../inputs/selects';
import {
    modalBackdropSx,
    modalFormRootSx,
    modalPrimaryButtonSx,
    modalSecondaryButtonSx,
    modalShellSx,
} from '../_shared/modalFormStyles';

export default function RouteModal(props) {


    const [form, setForm] = useState({
        origin: "",
        origin_state: "",
        destination: "",
        destination_state: "",
        distance: ""
    });

   
    const { states } = useSelector(state => state.states);

    const { origin, origin_state, destination, destination_state, distance } = form;
    const { route } = useSelector(state => state.routes);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const [texto, setTexto] = useState();

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            origin: "",
            origin_state: "",
            destination: "",
            destination_state: "",
            distance: ""
        });
        setTexto('');
        dispatch(closeModal());
        dispatch(showRoute({}));
    }


    const handleSaveData = async () => {
        route && route.id ? handlePutData() : handlePostData()
    }

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`A Rota ${form.origin.toUpperCase()} X ${form.destination.toUpperCase()} foi Cadastrado com sucesso!`));
        dispatch(addRouteFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`A Rota ${form.origin.toUpperCase()} X ${form.destination.toUpperCase()} foi Atualizado com sucesso!`));
        dispatch(editRouteFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    useEffect(() => {
        if (route && route.id)
            setForm(route);

    }, [route]);

    useEffect(() => {


    }, [route]);

    useEffect(() => {
        // if (isOpenModal === true) {
            dispatch(getAllStates());
        // }

        // if (isOpenModal === false) {
        //     setState({});
        //     // cleanForm();
        // }

    // }, [isOpenModal]);
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
                slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
                <Box sx={{ ...modalShellSx, ...modalFormRootSx }}>

                    <AlertModal />

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={route && route.id ? "Editar Rota " : "Cadastrar Rota "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <Stack spacing={2.2}>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' },
                                            gap: 2,
                                        }}
                                    >

                                        <TextField
                                            label={origin && origin.length > 0 ? `ORIGEM: ${50 - origin.length} caracteres restantes` : 'ORIGEM'}
                                            variant="outlined"
                                            name="origin"
                                            value={origin ? origin : ''}
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

                                        <BasicSelect
                                            value={origin_state}
                                            label={'Estado de Origem'}
                                            name={'origin_state'}
                                            store={states}
                                            changeItem={changeItem}
                                        />

                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' },
                                            gap: 2,
                                        }}
                                    >

                                        <TextField
                                            label={destination && destination.length > 0 ? `DESTINO: ${50 - destination.length} caracteres restantes` : 'DESTINO'}
                                            variant="outlined"
                                            name="destination"
                                            value={destination ? destination : ''}
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

                                        <BasicSelect
                                            value={destination_state}
                                            label={'Estado do Destino'}
                                            name={'destination_state'}
                                            store={states}
                                            changeItem={changeItem}
                                        />
                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '1fr' },
                                            gap: 2,
                                        }}
                                    >

                                        <TextField
                                            label={'DISTÂNCIA'}
                                            variant="outlined"
                                            name="distance"
                                            value={distance ? distance : ''}
                                            onChange={changeItem}
                                            required
                                            type="number"
                                            inputProps={{
                                                autoComplete: "off", // Desativa o preenchimento automático
                                            }}
                                        />
                                    </Box>

                                </Stack>
                                <Box sx={{ display: 'flex', gap: 1, mt: 2.2 }}>
                                    <Button onClick={handleSaveData} variant="contained" sx={modalPrimaryButtonSx}>
                                        Gravar
                                    </Button>

                                    <Button onClick={() => { cleanForm() }} variant="outlined" sx={modalSecondaryButtonSx}>
                                        Cancelar
                                    </Button>
                                </Box>
                            </BaseCard>
                        </Grid>
                    </Grid>

                </Box>
            </Modal>
        </div >
    );
}
