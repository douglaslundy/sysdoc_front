import React, { useState, useEffect } from 'react';
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

import { showOrdinance } from '../../../../store/ducks/ordinances';
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

export default function ViewOrdinanceModal(props) {
    const [item, setItem] = useState({
        year: "",
        type: "",
        title: "",
        subject: "",
        summary: "",
        content: "",
        legal_basis: "",
        department: "",
        signatory_name: "",
        signatory_role: "",
        publication_date: "",
        notes: "",
        created_at: ""
    });

    const { ordinance } = useSelector(state => state.ordinances);
    const { isOpenLetterModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const cleanItem = () => {
        setItem({
            year: "",
            type: "",
            title: "",
            subject: "",
            summary: "",
            content: "",
            legal_basis: "",
            department: "",
            signatory_name: "",
            signatory_role: "",
            publication_date: "",
            notes: "",
            created_at: ""
        });

        dispatch(turnModalViewLetter());
        dispatch(showOrdinance({}));
    };

    useEffect(() => {
        if (ordinance && ordinance.id) {
            setItem(ordinance);
        }
    }, [ordinance]);

    return (
        <div>
            {props.children}
            <Modal keepMounted open={isOpenLetterModal} onClose={cleanItem}>
                <Box sx={style}>
                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={ordinance && ordinance.id ? "Portaria " + ordinance.number : "você não selecionou uma portaria válida"}>
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600" }}>Título</Typography>
                                        <Typography sx={{ fontSize: "14px" }}>{item.title || ''}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600" }}>Assunto</Typography>
                                        <Typography sx={{ fontSize: "14px" }}>{item.subject || ''}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600" }}>Tipo / Ano</Typography>
                                        <Typography sx={{ fontSize: "14px" }}>{item.type || ''} / {item.year || ''}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600" }}>Setor</Typography>
                                        <Typography sx={{ fontSize: "14px" }}>{item.department || ''}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600" }}>Signatário</Typography>
                                        <Typography sx={{ fontSize: "14px" }}>
                                            {item.signatory_name || ''} {item.signatory_role ? `- ${item.signatory_role}` : ''}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600" }}>Resumo</Typography>
                                        <Typography sx={{ fontSize: "14px" }}>{item.summary || ''}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600" }}>Fundamentação Legal</Typography>
                                        <Typography sx={{ fontSize: "14px" }}>{item.legal_basis || ''}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600" }}>Conteúdo da Portaria</Typography>
                                        <Typography sx={{ fontSize: "16px" }}>{item.content || ''}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600" }}>Data de Publicação</Typography>
                                        <Typography sx={{ fontSize: "14px" }}>{item.publication_date || '---'}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600" }}>Observações</Typography>
                                        <Typography sx={{ fontSize: "14px" }}>{item.notes || ''}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: "600", textAlign: "right" }}>
                                            {ordinance && ordinance.user && ordinance.user.name}
                                        </Typography>

                                        <Typography variant="h6" sx={{ textAlign: "right" }}>
                                            {item.created_at && format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <br />
                                <Box sx={{ "& button": { mx: 1 } }}>
                                    <Button onClick={cleanItem} variant="outlined">
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