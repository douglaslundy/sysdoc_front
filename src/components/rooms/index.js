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
import RoomModal from "../modal/rooms";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllRooms, inactiveRoomFetch } from "../../store/fetchActions/rooms";
import { showRoom } from "../../store/ducks/rooms";
import { changeTitleAlert, turnModal, turnModalViewRoom } from "../../store/ducks/Layout";
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
    const { rooms } = useSelector(state => state.rooms);
    const [searchValue, setSearchValue] = useState();
    const [allRooms, setAllRooms] = useState(rooms);
    const { user, profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllRooms());
    }, []);

    useEffect(() => {
        setAllRooms(searchValue ? [...rooms.filter(room => room.name.toString().includes(searchValue.toString()))] : rooms);
    }, [rooms]);

    const HandleViewRoom = async room => {
        dispatch(showRoom(room));
        dispatch(turnModalViewRoom());
    }

    const HandleEditRoom = async room => {
        dispatch(showRoom(room));
        dispatch(turnModal());
    }

    const HandleInactiveRoom = async room => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir a Sala ${room.name}`, confirm: inactiveRoomFetch(room) })
        dispatch(changeTitleAlert(`O sala ${room.name} foi excluido com sucesso!`))
    }


    const searchRooms = ({ target }) => {
        setSearchValue(target.value);
        setAllRooms([...rooms.filter(
            room => room.name && room.name.toString().includes(target.value.toString()) ||
                room.description && room.description.toString().includes(target.value.toString())
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
        <BaseCard title={`Você possui ${allRooms.length} Salas Cadastrados`}>
            <AlertModal />
            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>

                <TextField
                    sx={{ width: "85%" }}
                    label="Pesquisar Sala"
                    name="search"
                    value={searchValue}
                    onChange={searchRooms}

                />

                <RoomModal>
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add">
                        <FeatherIcon icon="user-plus" />
                    </Fab>
                </RoomModal>
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
                                    Nome / Status
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Serviço / Descrição
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
                        {allRooms
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((room, index) => (
                                <StyledTableRow key={room.id} hover>
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
                                                        {room.name && room.name.substring(0, 50).toUpperCase()}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {room.status && room.status == "OPEN" ? "ABERTO" : room.status == "BUSY" ? "OCUPADO" : "FECHADO" }
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
                                                        {room && room.call_service.name.toUpperCase()}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {room.description && room.description.substring(0, 50).toUpperCase()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>                                       

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>

                                                <Button title="Editar Ofício" onClick={() => { HandleEditRoom(room) }} color="primary" size="medium" variant="contained"
                                                    disabled={profile != "admin" && room.id_user != user}>
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>

                                                <Button title="Excluir Ofício" onClick={() => { HandleInactiveRoom(room) }} color="error" size="medium" variant="contained"
                                                    // disabled={room.id_user == user || profile == "admin" ? allRooms.length - index !== allRooms.length : true}>
                                                    disabled={profile != "admin" && room.id_user != user}>
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
                    count={allRooms.length}
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
