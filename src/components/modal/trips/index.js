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

import { showVehicle } from '../../../store/ducks/vehicles';
import { turnModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editVehicleFetch, addVehicleFetch } from '../../../store/fetchActions/vehicles';
import AlertModal from '../../messagesModal';
import InputSelectClient from '../../inputs/inputSelectClient';
import { getAllClients } from '../../../store/fetchActions/clients';
import { getAllRoutes } from '../../../store/fetchActions/routes';
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

export default function VehicleModal(props) {


    const [form, setForm] = useState({
        route: "",
        departure_time: "",
    });

    const { route, departure_time, color, license_plate, renavan, chassis, capacity, year } = form;
    const { vehicle } = useSelector(state => state.vehicles);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const { clients } = useSelector(state => state.clients);
    const { routes } = useSelector(state => state.routes);
    const [cli, setClient] = useState([]);
    const [texto, setTexto] = useState();

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            departure_time: "",
        });
        setTexto('');
        dispatch(turnModal());
        dispatch(showVehicle({}));
    }


    const handleSaveData = async () => {
        vehicle && vehicle.id ? handlePutData() : handlePostData()
    }

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`O Veículo ${form.model.toUpperCase()} ${form.brand.toUpperCase()} PLACA ${form.license_plate.toUpperCase()} foi Cadastrado com sucesso!`));
        dispatch(addVehicleFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`O Veículo ${form.model.toUpperCase()} ${form.brand.toUpperCase()} PLACA ${form.license_plate.toUpperCase()} foi Atualizado com sucesso!`));
        dispatch(editVehicleFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    const handleSetDn = (value) => {
        setForm({ ...form, departure_time: value })
    }

    const transformedRoutes = (routes) =>
        routes.map(({ id, origin, destination }) => ({
            id,
            name: `${origin} X ${destination}` // Concatenar 'origin' e 'destination'
        }));


    useEffect(() => {
        if (vehicle && vehicle.id)
            setForm(vehicle);

    }, [vehicle]);


    useEffect(() => {
        if (isOpenModal === true) {
            dispatch(getAllClients());
            dispatch(getAllRoutes());
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
                            <BaseCard title={vehicle && vehicle.id ? "Editar Viagem " : "Cadastrar Viagem "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>

                                    <BasicDatePicker
                                        label="Data e hora de saída"
                                        name="departure_time, "
                                        value={departure_time}
                                        setValue={handleSetDn}
                                        required
                                        sx={{ width: '22%', mr: 2 }}
                                    />

                                    <InputSelectClient
                                        id="client"
                                        label="Selecione o cliente"
                                        name="client"
                                        clients={clients}
                                        setClient={setClient}
                                        wd={"100%"}
                                    />

                                    <Select
                                        value={route}
                                        label={'ROTA'}
                                        name={'route'}
                                        store={transformedRoutes(routes)}
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