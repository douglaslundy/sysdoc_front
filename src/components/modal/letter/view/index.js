import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';

import {
    Grid,
    Stack,
    Button,
    Typography,
} from "@mui/material";

import BaseCard from "../../../baseCard/BaseCard";

import { showLetter } from '../../../../store/ducks/letters';
import { turnModalViewLetter } from '../../../../store/ducks/Layout';
import { parseISO, format } from 'date-fns';


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

export default function ViewLetterModal(props) {

    const [lett, setLett] = useState({
        sender: "",
        recipient: "",
        subject_matter: "",
        obs: "",
        summary: "",
        created_at: ""
    });

    const { sender, recipient, subject_matter, obs, summary, created_at } = lett;
    const { letter } = useSelector(state => state.letters);
    const { isOpenLetterModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const cleanLett = () => {
        setLett({
            sender: "",
            recipient: "",
            subject_matter: "",
            obs: "",
            summary: "",
            created_at: ""
        });
        dispatch(turnModalViewLetter());
        dispatch(showLetter({}));
    }

    const handleClose = () => {
        cleanForm();
    };

    useEffect(() => {
        if (letter && letter.id)
            setLett(letter);

    }, [letter]);


    return (
        <div>
            {props.children}
            <Modal
                keepMounted
                open={isOpenLetterModal}
                onClose={handleClose}
                aria-labelledby="keep-mounted-modal-title"
                aria-describedby="keep-mounted-modal-description"
            >
                <Box sx={style}>

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={letter && letter.id ? "Ofício  " + letter.number : "você não selecionou um ofício válido"}>

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
                                            {subject_matter ? subject_matter.toUpperCase() : ''}
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
                                            Modelo Criado com Inteligência Artificial
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: "16px",
                                            }}
                                        >
                                           {obs ? obs : ''}
                                           {/* <pre> {obs ? obs : ''}</pre> */}
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
                                    <Button onClick={() => { cleanLett() }} variant="outlined" mt={2}>
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