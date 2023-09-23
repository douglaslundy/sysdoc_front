import React, { useEffect, useState } from "react";
import BaseCard from "../baseCard/BaseCard";
import { Alert, Box, Button, FormControlLabel, FormGroup, Stack, Switch, TextField } from "@mui/material";
import { parseCookies } from "nookies";
import { useRouter } from "next/router";
import { alterTypeOfAlert, changeTitleAlert, turnAlert, turnModal } from "../../store/ducks/Layout";
import { useDispatch, useSelector } from "react-redux";
import AlertModal from "../messagesModal";
import { getAllServices } from '../../store/fetchActions/service_calls';
import Select from '../inputs/selects';
import { finishCallFetch } from "../../store/fetchActions/calls";



export default function Attending() {

    const { 'sysvendas.call_id': id_call } = parseCookies();
    const { services } = useSelector(state => state.services);

    const [form, setForm] = useState({
        call_id: id_call,
        description: "",
        call_service_forwarded_id: "",
        client_id: "",
        service_status: "finished"
    });

    const { description, call_service_forwarded_id, call_id, client_id, service_status } = form;

    const [texto, setTexto] = useState();
    const router = useRouter();
    const dispatch = useDispatch();
    const { isOpenAlert } = useSelector(state => state.layout);
    const [isVisible, setIsVisible] = useState(false);


    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const cleanForm = () => {
        setForm({
            call_id: "",
            description: "",
            call_service_forwarded_id: "",
            client_id: "",
            service_status: "finished"
        });
    }

    const handleIsVisible = () => {
        setIsVisible(!isVisible);
        setForm({ ...form, service_status: isVisible ? 'finished' : 'forwarded' })
    }

    const handleSaveData = async () => {
        call_id && call_id != 'null' ? handlePostData() : dispatch(turnAlert()) && router.push('/listing_calls');
    }

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`Atendimento gravado com sucesso!`));
        dispatch(finishCallFetch(form, cleanForm()));
    };

    const prohibitedAction = () => {
        dispatch(changeTitleAlert(`Você não pode realizar esta ação, pois não possui um atendimento aberto`));
        dispatch(alterTypeOfAlert(false));
        !isOpenAlert && dispatch(turnAlert()) && router.push('/listing_calls');
    }

    useEffect(() => {
        (!call_id || call_id == 'null') && prohibitedAction();
    }, []);

    useEffect(() => {
        dispatch(getAllServices());
    }, []);

    return (
        <BaseCard title={`Você está atendendo a senha de Nº ${id_call}`}>

            <AlertModal />

            {texto &&
                <Alert variant="filled" severity="warning">
                    {texto}
                </Alert>
            }

            {/* <FormGroup > */}
            <Stack spacing={3}>

                <TextField
                    id="description"
                    label={description && description.length > 0 ? `Resumo: ${500 - description.length} caracteres restantes` : 'Descrição'}
                    multiline
                    rows={2}
                    value={description}
                    name="description"
                    onChange={changeItem}
                    inputProps={{
                        style: {
                            textTransform: "uppercase"
                        },
                        maxLength: 500
                    }}
                />

                <FormGroup>
                    <FormControlLabel control={<Switch checked={isVisible}
                        onClick={handleIsVisible} />} label={isVisible ? "Encaminhar" : "Finalizar"} />
                </FormGroup>

                {
                    isVisible &&
                    <Select
                        value={call_service_forwarded_id}
                        label={'Serviço'}
                        name={'call_service_forwarded_id'}
                        store={services}
                        changeItem={changeItem}
                    />
                }

            </Stack>
            {/* </FormGroup> */}
            <br />
            <Box sx={{ "& button": { mx: 1 } }}>
                <Button onClick={handleSaveData} variant="contained" mt={2}>
                    {isVisible ? 'Encaminhar' : 'Finalizar'}
                </Button>

                <Button onClick={() => { cleanForm() }} variant="outlined" mt={2}>
                    Cancelar
                </Button>
            </Box>
        </BaseCard>
    );
};
