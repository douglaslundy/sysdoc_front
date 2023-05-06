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
import ServiceModal from "../modal/service_calls";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllServices, inactiveServiceFetch } from "../../store/fetchActions/service_calls";
import { showService } from "../../store/ducks/service_calls";
import { changeTitleAlert, turnModal, turnModalViewService } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";

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
    const { services } = useSelector(state => state.services);
    const [searchValue, setSearchValue] = useState();
    const [allServices, setAllServices] = useState(services);
    const { user, profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllServices());
    }, []);

    useEffect(() => {
        setAllServices(searchValue ? [...services.filter(serv => serv.number.toString().includes(searchValue.toString()))] : services);
    }, [services]);

    const HandleViewService = async service => {
        dispatch(showService(service));
        dispatch(turnModalViewService());
    }

    const HandleEditService = async service => {
        dispatch(showService(service));
        dispatch(turnModal());
    }

    const HandleInactiveService = async service => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir o Serviço ${service.name}`, confirm: inactiveServiceFetch(service) })
        dispatch(changeTitleAlert(`O servico ${service.name} foi excluido com sucesso!`))
    }


    const searchservices = ({ target }) => {
        setSearchValue(target.value);
        setAllServices([...services.filter(
            serv => serv.name && serv.name.toString().includes(target.value.toString()) ||
                serv.id && serv.id.toString().includes(target.value.toString())
        )]);
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
        <BaseCard title={`Você possui ${allServices.length} Serviços Cadastrados`}>
            <AlertModal />
            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>

                <TextField
                    sx={{ width: "85%" }}
                    label="Pesquisar serviço"
                    name="search"
                    value={searchValue}
                    onChange={searchservices}

                />

                <ServiceModal>
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add">
                        <FeatherIcon icon="user-plus" />
                    </Fab>
                </ServiceModal>
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
                                    ID
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Nome / Descrição
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography color="textSecondary" variant="h6">
                                    Ações
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allServices
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((service, index) => (
                                <StyledTableRow key={service.id} hover>
                                    <>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: "600",
                                                            fontSize: "20px",
                                                        }}
                                                    >
                                                        {service && service.id}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {service.created_at && format(parseISO(service.created_at), 'dd/MM/yyyy HH:mm:ss')}
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
                                                        {service.name && service.name.substring(0, 30).toUpperCase()}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {service.description && service.description.substring(0, 30).toUpperCase()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>                                       

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>

                                                <Button title="Editar Ofício" onClick={() => { HandleEditService(service) }} color="primary" size="medium" variant="contained"
                                                    disabled={profile != "admin" && service.id_user != user}>
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>

                                                <Button title="Excluir Ofício" onClick={() => { HandleInactiveService(service) }} color="error" size="medium" variant="contained"
                                                    // disabled={service.id_user == user || profile == "admin" ? allServices.length - index !== allServices.length : true}>
                                                    disabled={profile != "admin" && service.id_user != user}>
                                                    <FeatherIcon icon="trash" width="20" height="20" />
                                                </Button>

                                            </Box>
                                        </TableCell>
                                    </>

                                </StyledTableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={allServices.length}
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
