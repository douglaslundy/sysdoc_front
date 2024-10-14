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

import { showTrip } from '../../../store/ducks/trips';
import { turnModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { getAllVehicles } from '../../../store/fetchActions/vehicles';
import { editTripFetch, addTripFetch } from '../../../store/fetchActions/trips';
import AlertModal from '../../messagesModal';
import InputSelectClient from '../../inputs/inputSelectClient';
import { getAllUsers } from '../../../store/fetchActions/user';
import { getAllRoutes } from '../../../store/fetchActions/routes';
import Select from '../../inputs/selects';
import DateTime from '../../inputs/dateTime';
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

export default function TripModal(props) {


    const [form, setForm] = useState({
        vehicle_id: "",
        route_id: "",
        driver_id: "",
        departure_time: "",
        departure_date: "",
        driver: "",
        obs: ""
    });

    const { vehicle_id, route_id, driver_id, departure_time, departure_date, obs } = form;
    const { vehicles } = useSelector(state => state.vehicles);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const { users } = useSelector(state => state.users);
    const { routes } = useSelector(state => state.routes);
    const { trip } = useSelector(state => state.trips);
    // const [driv, setDriver] = useState([]);
    const [texto, setTexto] = useState();

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            vehicle_id: "",
            route_id: "",
            driver_id: "",
            departure_time: "",
            departure_date: "",
            obs: ""
        });
        setTexto('');
        dispatch(turnModal());
        dispatch(showTrip({}));
    }


    const handleSaveData = async () => {
        trip && trip.id ? handlePutData() : handlePostData()
    }

    const handlePostData = async () => {
        // dispatch(changeTitleAlert(`Viagem com destino ${form.destination.toUpperCase()} foi Cadastrada com sucesso!`));
        dispatch(changeTitleAlert(`Viagem Cadastrada com sucesso!`));
        dispatch(addTripFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`Viagem Atualizada com sucesso!`));
        dispatch(editTripFetch(form, cleanForm));
    };

    const handleClose = () => {
        cleanForm();
    };

    const handleSetDepartureDate = (value) => {
        setForm({ ...form, departure_date: value })
    }

    const transformedVehicle = (vechiles) =>
        vechiles.map(({ id, license_plate, brand, model, capacity }) => ({
            id,
            name: `${license_plate} - ${brand}  ${model} CAPACIDADE ${capacity} LUGARES`
        }));

    const transformedRoutes = (routes) =>
        routes.map(({ id, origin, destination }) => ({
            id,
            name: `${origin} X ${destination}` // Concatenar 'origin' e 'destination'
        }));

    const getDrivers = (users) =>
        users
            .filter(user => user.profile === 'driver') // Filtra somente os usuários com profile "driver"
            .map(({ id, name }) => ({
                id,
                name
            }));


    useEffect(() => {
        if (trip && trip.id)
            setForm(trip);

    }, [trip]);

    // useEffect(() => {
    //     setForm({
    //         ...form,
    //         driver: driv.id,
    //     });

    // }, [driv]);


    useEffect(() => {
        if (isOpenModal === true) {
            dispatch(getAllUsers());
            dispatch(getAllRoutes());
            dispatch(getAllVehicles());
        }

        // if (isOpenModal === false) {
        //     setDriver({});
        //     // cleanForm();
        // }

    }, [isOpenModal]);

    // useEffect(() => {
    //     setForm({
    //         ...form,
    //         client: cli.id
    //     })
    // }, [cli]);

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
                            <BaseCard title={trip && trip.id ? "Editar Viagem " : "Cadastrar Viagem "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <br />

                                {/* <FormGroup > */}
                                <Stack spacing={3}>

                                    <Box sx={{
                                        '& > :not(style)': { mb: 0 },
                                        'display': 'flex',
                                        'justify-content': 'space-between'
                                    }} >

                                        {isOpenModal &&
                                            <>
                                                <BasicDatePicker
                                                    id="departure_date"
                                                    label="Data da Viagem"
                                                    name="departure_date, "
                                                    value={departure_date}
                                                    setValue={handleSetDepartureDate}
                                                    required
                                                    sx={{ width: '50%', mr: 2 }}
                                                />

                                                <DateTime
                                                    id="departure_time"
                                                    label="Horário de saída"
                                                    name="departure_time"
                                                    value={departure_time}
                                                    onChange={changeItem}
                                                    wd={"50%"}
                                                />
                                            </>

                                        }



                                    </Box>

                                    <Select
                                        label={'SELECIONE O MOTORISTA'}
                                        name={'driver_id'}
                                        value={driver_id}
                                        store={getDrivers(users)}
                                        changeItem={changeItem}
                                        wd={"100%"}
                                    />

                                    <Select
                                        value={route_id}
                                        label={'SELECIONE A ROTA'}
                                        name={'route_id'}
                                        store={transformedRoutes(routes)}
                                        changeItem={changeItem}
                                    />

                                    <Select
                                        value={vehicle_id}
                                        label={'SELECIONE O VEICULO'}
                                        name={'vehicle_id'}
                                        store={transformedVehicle(vehicles)}
                                        changeItem={changeItem}
                                    />

                                    <TextField
                                        id="Obs"
                                        label={obs && obs.length > 0 ? `Observações: ${300 - obs.length} caracteres restantes` : 'Observações'}
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
                                            maxLength: 300
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
        </div >
    );
}