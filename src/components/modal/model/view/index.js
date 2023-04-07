import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { parseISO, format } from 'date-fns';

import {
    Grid,
    Stack,
    Button,
    Typography,
} from "@mui/material";

import BaseCard from "../../../baseCard/BaseCard";

import { showModel } from '../../../../store/ducks/models';
import { turnModalViewModel } from '../../../../store/ducks/Layout';


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

export default function ViewModelModal(props) {

    const [mod, setMod] = useState({
        summary: "",
        prompt: "",
        model: "",
        subject: "",
        sender: "",
        recipient: "",
        created_at: "",
    });

    const { summary, prompt, model, subject, sender, recipient, created_at } = mod;

    const { model: md } = useSelector(state => state.models);
    const { isOpenModelModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const cleanMod = () => {
        setMod({
            summary: "",
            prompt: "",
            model: "",
            subject: "",
            sender: "",
            recipient: "",
            created_at: "",
        });
        dispatch(turnModalViewModel());
        dispatch(showModel({}));
    }

    const handleClose = () => {
        cleanMod();
    };

    useEffect(() => {
        if (md && md.id)
            setMod(md);

    }, [md]);


    return (
        <div>
            {props.children}
            <Modal
                keepMounted
                open={isOpenModelModal}
                onClose={handleClose}
                aria-labelledby="keep-mounted-modal-title"
                aria-describedby="keep-mounted-modal-description"
            >
                <Box sx={style}>

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={md && md.id ? "Modelo  " + md.id : "você não selecionou um ofício válido"}>

                                <Stack spacing={3}>
                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Remetente
                                        </Typography>
                                        <Typography
                                            // color="textSecondary"
                                            sx={{
                                                fontSize: "14px",
                                            }}
                                        >
                                            {sender ? sender.toUpperCase() : ''}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Destinatário
                                        </Typography>
                                        <Typography
                                            // color="textSecondary"
                                            sx={{
                                                fontSize: "14px",
                                            }}
                                        >
                                            {recipient ? recipient.toUpperCase() : ''}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Assunto
                                        </Typography>
                                        <Typography
                                            // color="textSecondary"
                                            sx={{
                                                fontSize: "14px",
                                            }}
                                        >
                                            {subject ? subject.toUpperCase() : ''}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Resumo
                                        </Typography>
                                        <Typography
                                            // color="textSecondary"
                                            sx={{
                                                fontSize: "14px",
                                            }}
                                        >
                                            {summary ? summary.toUpperCase() : ''}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Prompt utilizado
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: "16px",
                                            }}
                                        >
                                            {prompt ? prompt : ''}
                                            {/* <pre> {prompt ? prompt : ''}</pre> */}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                            }}
                                        >
                                            Modelo Criado com Inteligência Artificial
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: "16px",
                                            }}
                                        >
                                            {model ? model : ''}
                                            {/* <pre> {model ? model : ''}</pre> */}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: "600",
                                                textAlign: "right"
                                            }}
                                        >
                                            {created_at && "Criado em " + format(parseISO(created_at), 'dd/MM/yyyy HH:mm:ss')}
                                            {/* Data */}
                                        </Typography>
                                    </Box>


                                </Stack>
                                <br />
                                <Box sx={{ "& button": { mx: 1 } }}>
                                    <Button onClick={() => { cleanMod() }} variant="outlined" mt={2}>
                                        Voltar
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