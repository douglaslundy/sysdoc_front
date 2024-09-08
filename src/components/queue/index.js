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
import QueueOutcomeModal from "../modal/outcomequeue";
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
    const [searchValue, setSearchValue] = useState('');
    const [allQueues, setAllQueues] = useState(queues);
    const { user, profile } = useContext(AuthContext);
    const [option, setOption] = useState('add'); // Você já tem esse estado definido
    const [speci, setSpeci] = useState('');
    const [done, setDone] = useState(2);

    const uniqueSpeci = Array.from(new Set(queues.map(item => item.speciality?.name)));

    // Transforma a variável specialities em um array JSON
    const speciExits = Object.values({ ...uniqueSpeci }).map(item => ({
        id: item,
        name: item,
    }));

    const changeSpeci = ({ target }) => {
        setSpeci(target.value)
    }

    const dataDone = [
        {
            'id': 0,
            'name': 'NÃO'
        },
        {
            'id': 1,
            'name': 'SIM'
        },
        {
            'id': 2,
            'name': 'TODOS'
        }
    ]

    const storeDone = Object.values({ ...dataDone }).map(item => ({
        id: item.id,
        name: item.name,
    }));

    const changeDone = ({ target }) => {
        setDone(target.value)
    }


    useEffect(() => {
        dispatch(getAllQueues());
    }, [dispatch]);

    useEffect(() => {
        if (queues.length > 0) {
            const filteredQueues = speci
                ? queues.filter(lett => lett.speciality?.name === speci)
                : [...queues];

            setAllQueues(done > 1 ? filteredQueues : filteredQueues.filter(lett => lett.done == done));
        }
    }, [speci, queues, done]);

    useEffect(() => {
        // Executado apenas quando a página é carregada pela primeira vez, ou quando é adicionado um registro
        let filteredQueues = searchValue
            ? queues.filter(lett => lett.client.name.toString().toLowerCase().includes(searchValue.toString().toLowerCase()))
            : queues;

        if (speci) {
            filteredQueues = filteredQueues.filter(lett => lett.speciality.name === speci);
        }

        setAllQueues(done > 1 ? filteredQueues : filteredQueues.filter(lett => lett.done == done));
    }, [queues, searchValue, speci, done]);

    useEffect(() => {
        if (searchValue || speci || done !== undefined) {
            const filterPerSearch = (lett) =>
                (lett.client?.name && lett.client.name.toLowerCase().includes(searchValue.toLowerCase())) ||
                (lett.client?.cpf && lett.client.cpf.toLowerCase().includes(searchValue.toLowerCase())) ||
                (lett.client?.cns && lett.client.cns.toLowerCase().includes(searchValue.toLowerCase())) ||
                (lett.client?.phone && lett.client.phone.toLowerCase().includes(searchValue.toLowerCase()));

            let filteredQueues = speci
                ? queues.filter(lett => lett.speciality?.name === speci).filter(filterPerSearch)
                : queues.filter(filterPerSearch);

            setAllQueues(done > 1 ? filteredQueues : filteredQueues.filter(lett => lett.done == done));
        } else {
            setAllQueues(done > 1 ? [...queues] : queues.filter(lett => lett.done == done));
        }
    }, [searchValue, speci, queues, done]);




    // const HandleEditQueue = async queue => {
    //     dispatch(showQueue(queue));
    //     dispatch(turnModal());
    // }

    // const HandleInactiveQueue = async queue => {
    //     setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir a especialidade ${queue.id}`, confirm: inactiveQueueFetch(queue) })
    //     dispatch(changeTitleAlert(`O queuee ${queue.number} foi excluido com sucesso!`))
    // }

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const HandleDoneQueue = (queue) => {
        dispatch(showQueue(queue));
        setOption('outcome');
        dispatch(turnModal());
    };

    const HandleAddQueue = () => {
        setOption('add');
        dispatch(turnModal());
    };

    const searchQueues = ({ target }) => {
        setSearchValue(target.value);
    };


    const SwitchModal = ({ option }) => {
        switch (option) {
            case 'outcome':
                return <QueueOutcomeModal />;
            case 'add':
                return <QueueModal />;
            default:
                return <></>;
        }
    };

    return (
        <BaseCard title={`Você possui ${allQueues.length} especialidades Cadastradas`}>
            <AlertModal />

            <SwitchModal option={option} />

            <Box sx={{
                '& > :not(style)': { mb: 0, mt: 2 },
                'display': 'flex',
                'justify-content': 'space-between'
            }}
            >

                <TextField
                    sx={{ width: "60%" }}
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

                <Select
                    label="Realizado"
                    name="done"
                    value={done}
                    store={storeDone}
                    changeItem={changeDone}
                    wd={"10%"}
                />

                {/* <Select
                    label="Ano"
                    name="year"
                    value={year}
                    store={transformedYears}
                    changeItem={changeYear}
                    wd={"20%"}
                /> */}

                <Fab onClick={() => { HandleAddQueue() }} color="primary" aria-label="add">
                    <FeatherIcon icon="plus" />
                </Fab>
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
                                                        {queue.created_at && format(parseISO(queue.date_of_received), 'dd/MM/yyyy')} / {queue.urgency == 1 ? 'URGENTE' : 'ROTINA'}
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

                                                <Button title="Informar Desfecho" onClick={() => { HandleDoneQueue(queue) }} color="primary" size="medium" variant="contained" disabled={queue.done}>
                                                    <FeatherIcon icon="book-open" width="20" height="20" />
                                                </Button>

                                                <Button title="Excluir da fila" onClick={() => { HandleInactiveQueue(queue) }} color="error" size="medium" variant="contained" disabled={true}>
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
