import React, { useState, useEffect, useContext } from "react";
import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Fab,
    Button,
    styled,
    TableContainer,
    TablePagination,
    TextField
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
import QueueModal from "../modal/queue";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllQueues, inactiveQueueFetch } from "../../store/fetchActions/queues";
import { showQueue } from "../../store/ducks/queues";
import { changeTitleAlert, turnModal, turnModalViewQueue } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import Select from '../inputs/selects';

import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";


const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

export default () => {
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const dispatch = useDispatch();
    const { queues } = useSelector(state => state.queues);
    const [searchValue, setSearchValue] = useState();
    const [allQueues, setAllQueues] = useState(queues);
    const { user, profile } = useContext(AuthContext);

    const [speci, setSpeci] = useState('');
    const uniqueSpeci = Array.from(new Set(queues.map(item => item.speciality.name)));

    // Transforma a variável specialities em um array JSON
    const speciExits = Object.values({ ...uniqueSpeci }).map(item => ({
        id: item,
        name: item,
    }));

    const changeSpeci = ({ target }) => {
        setSpeci(target.value)
    }


    useEffect(() => {
        dispatch(getAllQueues());
    }, []);

    useEffect(() => {
        setAllQueues([...queues.filter(lett => lett.speciality.name == speci)]);
    }, [speci]);

    useEffect(() => {
        // executado apenas quando é carregado a pagina a primeira vez, ou quando é adicionado um registro 
        setAllQueues(searchValue ?
            [...queues.filter(lett => lett.client.name.toString().toLowerCase().includes(searchValue.toString().toLowerCase()))]
            : !speci ? [...queues] : [...queues.filter(lett => lett.speciality.name == speci)]);
    }, [queues]);


    const HandleEditQueue = async queue => {
        dispatch(showQueue(queue));
        dispatch(turnModal());
    }

    const HandleInactiveQueue = async queue => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir a especialidade ${queue.id}`, confirm: inactiveQueueFetch(queue) })
        dispatch(changeTitleAlert(`O queuee ${queue.number} foi excluido com sucesso!`))
    }


    const searchQueues = ({ target }) => {
        setSearchValue(target.value);

        const filterPerSearch = (
            lett => lett.client.name && lett.client.name.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                lett.client.cpf && lett.client.cpf.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                lett.client.cns && lett.client.cns.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                lett.client.phone && lett.client.phone.toString().toLowerCase().includes(target.value.toString().toLowerCase()
                )
        );

        const filterPerService = (lett => lett.speciality.name == speci);

        setAllQueues(
            speci
                ? [...queues.filter(filterPerService).filter(filterPerSearch)]
                : [...queues.filter(filterPerSearch)]
        );

    }

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <BaseCard title={`Você possui ${allQueues.length} especialidades Cadastradas`}>
            <AlertModal />

            <Box sx={{
                '& > :not(style)': { mb: 0, mt: 2 },
                'display': 'flex',
                'justify-content': 'space-between'
            }}
            >

                <TextField
                    sx={{ width: "65%" }}
                    label="Pesquisar por Nome / CPF / CNS"
                    name="search"
                    value={searchValue}
                    onChange={searchQueues}

                />

                <Select
                    label="Especialidade"
                    name="speci"
                    value={speci}
                    store={speciExits}
                    changeItem={changeSpeci}
                    wd={"20%"}
                />

                {/* <Select
                    label="Ano"
                    name="year"
                    value={year}
                    store={transformedYears}
                    changeItem={changeYear}
                    wd={"20%"}
                /> */}

                <QueueModal>
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add">
                        <FeatherIcon icon="plus" />
                    </Fab>
                </QueueModal>
            </Box>

            <TableContainer>

                <Table
                    aria-label="simple table"
                    sx={{
                        mt: 3,
                        whiteSpace: "nowrap",
                    }}
                >
                    <TableHead>

                        <TableRow>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Código
                                </Typography>

                                <Typography color="textSecondary" variant="h6">
                                    Cadastrador
                                </Typography>

                                <Typography color="textSecondary" variant="h6">
                                    Data / URGENTE
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Cidadão
                                </Typography>
                                <Typography color="textSecondary" variant="h6">
                                    MÃE
                                </Typography>
                                <Typography color="textSecondary" variant="h6">
                                    CPF / CNS / Telefone
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Especialidade
                                </Typography>
                                <Typography color="textSecondary" variant="h6">
                                    Observação
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Realizado?
                                </Typography>
                                <Typography color="textSecondary" variant="h6">
                                    Data
                                </Typography>
                            </TableCell>

                            <TableCell align="center">
                                <Typography color="textSecondary" variant="h6">
                                    Ações
                                </Typography>
                            </TableCell>

                        </TableRow>

                    </TableHead>

                    {allQueues.length >= 1 ?

                        <TableBody>
                            {allQueues
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((queue, index) => (

                                    <StyledTableRow key={queue.id} hover>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h4"
                                                        sx={{
                                                            fontWeight: "600"
                                                        }}
                                                    >
                                                        {queue && queue.id}
                                                    </Typography>

                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {queue.user && queue.user.name}
                                                        {/* {queue.created_at && format(parseISO(queue.created_at), 'dd/MM/yyyy HH:mm:ss')} */}

                                                    </Typography>

                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {queue.created_at && format(parseISO(queue.date_of_received), 'dd/MM/yyyy')} / {queue.urgency == 0 ? 'URGENTE' : 'ROTINA'}
                                                        {/* {queue.created_at && format(parseISO(queue.created_at), 'dd/MM/yyyy HH:mm:ss')} */}

                                                    </Typography>

                                                </Box>
                                            </Box>

                                        </TableCell>

                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "left"
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        {queue.client && queue.client.name.substring(0, 30).toUpperCase()}
                                                    </Typography>

                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {queue.client.mother && queue.client.mother.substring(0, 30).toUpperCase()}
                                                    </Typography>


                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {queue.client && queue.client.cpf} / {queue.client && queue.client.cns} / {queue.client && queue.client.phone}
                                                    </Typography>
                                                </Box>

                                            </Box>

                                        </TableCell>

                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "left"
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        {queue.speciality && queue.speciality.name.substring(0, 30).toUpperCase()}
                                                    </Typography>

                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {queue.obs && queue.obs.substring(0, 50).toUpperCase()}
                                                    </Typography>

                                                </Box>

                                            </Box>

                                        </TableCell>

                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "left"
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        {queue.done == 0 ? 'NÃO' : 'SIM'}
                                                    </Typography>

                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {queue.date_of_realized && format(parseISO(queue.date_of_realized), 'dd/MM/yyyy')}
                                                    </Typography>

                                                </Box>

                                            </Box>

                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>

                                                {/* <Button title="Editar Especialidade" onClick={() => { HandleEditQueue(queue) }} color="primary" size="medium" variant="contained"
                                                    disabled={profile != "admin" && queue.id_user != user}>
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button> */}

                                                <Button title="Excluir da fila" onClick={() => {
                                                    HandleInactiveQueue(queue)
                                                }} color="error" size="medium" variant="contained"
                                                    disabled={true}>
                                                    <FeatherIcon icon="trash" width="20" height="20" />
                                                </Button>

                                            </Box>
                                        </TableCell>

                                    </StyledTableRow>
                                ))}
                        </TableBody>

                        :

                        <TableCell align="center">
                            Nenhum registro encontrado!
                        </TableCell>

                    }

                </Table>

                <TablePagination
                    component="div"
                    count={allQueues.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
            <ConfirmDialog
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog} />

        </BaseCard >
    );
};
