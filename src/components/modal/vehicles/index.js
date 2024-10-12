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
        brand: "",
        model: "",
        color: "",
        license_plate: "",
        renavan: "",
        chassis: "",
        capacity: "",
        year: ""
    });

    const { brand, model, color, license_plate, renavan, chassis, capacity, year } = form;
    const { vehicle } = useSelector(state => state.vehicles);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const [texto, setTexto] = useState();

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            brand: "",
            model: "",
            color: "",
            license_plate: "",
            renavan: "",
            chassis: "",
            capacity: "",
            year: ""
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

    useEffect(() => {
        if (vehicle && vehicle.id)
            setForm(vehicle);

    }, [vehicle]);

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
                            <BaseCard title={vehicle && vehicle.id ? "Editar Veículo " : "Cadastrar Veículo "}>
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
                                    }}
                                    >

                                        <TextField
                                            label={brand && brand.length > 0 ? `MARCA: ${20 - brand.length} caracteres restantes` : 'MARCA'}
                                            variant="outlined"
                                            name="brand"
                                            value={brand ? brand : ''}
                                            onChange={changeItem}
                                            required
                                            sx={{ width: '30%', mr: 2 }}
                                            inputProps={{
                                                style: {
                                                    textTransform: "uppercase",
                                                },
                                                maxLength: 20,
                                                autoComplete: "off", // Desativa o preenchimento automático
                                            }}
                                        />

                                        <TextField
                                            label={model && model.length > 0 ? `MODELO: ${20 - model.length} caracteres restantes` : 'MODELO'}
                                            variant="outlined"
                                            name="model"
                                            value={model ? model : ''}
                                            onChange={changeItem}
                                            sx={{ width: '30%', mr: 2 }}
                                            required
                                            inputProps={{
                                                style: {
                                                    textTransform: "uppercase",
                                                },
                                                maxLength: 20,
                                                autoComplete: "off", // Desativa o preenchimento automático
                                            }}
                                        />


                                        <TextField
                                            label={color && color.length > 0 ? `COR: ${10 - color.length} caracteres restantes` : 'COR'}
                                            variant="outlined"
                                            name="color"
                                            value={color ? color : ''}
                                            sx={{ width: '24%', mr: 2 }}
                                            onChange={changeItem}
                                            required
                                            inputProps={{
                                                style: {
                                                    textTransform: "uppercase",
                                                },
                                                maxLength: 10,
                                                autoComplete: "off", // Desativa o preenchimento automático
                                            }}
                                        />

                                        <TextField
                                            label={year && capacity.length > 0 ? `ANO` : 'ANO'}
                                            variant="outlined"
                                            name="year"
                                            value={year ? year : ''}
                                            onChange={changeItem}
                                            sx={{ width: '15%', mr: 2 }}
                                            required
                                            type="number"
                                            inputProps={{
                                                style: {
                                                    textTransform: "uppercase",
                                                },
                                                autoComplete: "off", // Desativa o preenchimento automático
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{
                                        '& > :not(style)': { mb: 0 },
                                        'display': 'flex',
                                        'justify-content': 'space-between'
                                    }}
                                    >

                                        <TextField
                                            label={license_plate && license_plate.length > 0 ? `PLACA: ${7 - license_plate.length} caracteres restantes` : 'PLACA'}
                                            variant="outlined"
                                            name="license_plate"
                                            value={license_plate ? license_plate : ''}
                                            onChange={changeItem}
                                            sx={{ width: '20%', mr: 2 }}
                                            required
                                            inputProps={{
                                                style: {
                                                    textTransform: "uppercase",
                                                },
                                                maxLength: 7,
                                                autoComplete: "off", // Desativa o preenchimento automático
                                            }}
                                        />

                                        <TextField
                                            label={renavan && renavan.length > 0 ? `RENAVAN: ${11 - renavan.length} caracteres restantes` : 'RENAVAN'}
                                            variant="outlined"
                                            name="renavan"
                                            value={renavan ? renavan : ''}
                                            onChange={changeItem}
                                            sx={{ width: '20%', mr: 2 }}
                                            required
                                            inputProps={{
                                                style: {
                                                    textTransform: "uppercase",
                                                },
                                                maxLength: 11,
                                                autoComplete: "off", // Desativa o preenchimento automático
                                            }}
                                        />

                                        <TextField
                                            label={chassis && chassis.length > 0 ? `CHASSI: ${17 - chassis.length} caracteres restantes` : 'CHASSI'}
                                            variant="outlined"
                                            name="chassis"
                                            value={chassis ? chassis : ''}
                                            onChange={changeItem}
                                            sx={{ width: '40%', mr: 2 }}
                                            required
                                            inputProps={{
                                                style: {
                                                    textTransform: "uppercase",
                                                },
                                                maxLength: 17,
                                                autoComplete: "off", // Desativa o preenchimento automático
                                            }}
                                        />

                                        <TextField
                                            label={capacity && capacity.length > 0 ? `CAPACIDADE` : 'CAPACIDADE'}
                                            variant="outlined"
                                            name="capacity"
                                            value={capacity ? capacity : ''}
                                            onChange={changeItem}
                                            sx={{ width: '15%', mr: 2 }}
                                            required
                                            type="number"
                                            inputProps={{
                                                style: {
                                                    textTransform: "uppercase",
                                                },
                                                autoComplete: "off", // Desativa o preenchimento automático
                                            }}
                                        />
                                    </Box>

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