import { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import BaseCard from '../../baseCard/BaseCard';

import {
    Grid,
    Stack,
    TextField,
    Alert,
    Button,
} from "@mui/material";

import { showVehicle } from '../../../store/ducks/vehicles';
import { closeModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editVehicleFetch, addVehicleFetch } from '../../../store/fetchActions/vehicles';
import AlertModal from '../../messagesModal';
import {
    modalBackdropSx,
    modalFormRootSx,
    modalPrimaryButtonSx,
    modalSecondaryButtonSx,
    modalShellSx,
} from '../_shared/modalFormStyles';

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
        dispatch(closeModal());
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
                slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
                <Box sx={{ ...modalShellSx, ...modalFormRootSx }}>

                    <AlertModal />

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={vehicle && vehicle.id ? "Editar Veículo " : "Cadastrar Veículo "}>
                                {texto &&
                                    <Alert variant="filled" severity="warning">
                                        {texto}
                                    </Alert>
                                }

                                <Stack spacing={2.2}>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' },
                                            gap: 2,
                                        }}
                                    >

                                        <TextField
                                            label={brand && brand.length > 0 ? `MARCA: ${20 - brand.length} caracteres restantes` : 'MARCA'}
                                            variant="outlined"
                                            name="brand"
                                            value={brand ? brand : ''}
                                            onChange={changeItem}
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
                                            label={model && model.length > 0 ? `MODELO: ${20 - model.length} caracteres restantes` : 'MODELO'}
                                            variant="outlined"
                                            name="model"
                                            value={model ? model : ''}
                                            onChange={changeItem}
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

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 2fr 1fr' },
                                            gap: 2,
                                        }}
                                    >

                                        <TextField
                                            label={license_plate && license_plate.length > 0 ? `PLACA: ${7 - license_plate.length} caracteres restantes` : 'PLACA'}
                                            variant="outlined"
                                            name="license_plate"
                                            value={license_plate ? license_plate : ''}
                                            onChange={changeItem}
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
        </div>
    );
}

