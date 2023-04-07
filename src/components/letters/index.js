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
import LetterModal from "../modal/letter";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllLetters, inactiveLetterFetch } from "../../store/fetchActions/letter";
import { showLetter } from "../../store/ducks/letters";
import { changeTitleAlert, turnModal } from "../../store/ducks/Layout";
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
    const { letters, letter } = useSelector(state => state.letters);
    const [searchValue, setSearchValue] = useState();
    const [allLetters, setAllLetters] = useState(letters);
    const { user, profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllLetters());
    }, []);

    useEffect(() => {
        setAllLetters(searchValue ? [...letters.filter(lett => lett.number.toString().includes(searchValue.toString()))] : letters);
    }, [letters]);



    const HandleViewLetter = async letter => {
        dispatch(showLetter(letter));
        dispatch(turnModal());
    }

    const HandleEditLetter = async letter => {
        dispatch(showLetter(letter));
        dispatch(turnModal());
    }

    const HandleInactiveLetter = async letter => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir o Ofício ${letter.number}`, confirm: inactiveLetterFetch(letter) })
        dispatch(changeTitleAlert(`O lettere ${letter.number} foi excluido com sucesso!`))
    }


    const searchletters = ({ target }) => {
        setSearchValue(target.value);
        setAllLetters([...letters.filter(
            lett => lett.number && lett.number.toString().includes(target.value.toString()) ||
                lett.sender && lett.sender.toString().includes(target.value.toString()) ||
                lett.recipient && lett.recipient.toString().includes(target.value.toString()) ||
                lett.subject_matter && lett.subject_matter.toString().includes(target.value.toString())
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
        <BaseCard title={`Você possui ${allLetters.length} ofícios Cadastrados`}>
            <AlertModal />

            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>

                <TextField
                    sx={{ width: "85%" }}
                    label="Pesquisar ofício"
                    name="search"
                    value={searchValue}
                    onChange={searchletters}

                />


                <LetterModal>
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add">
                        <FeatherIcon icon="user-plus" />
                    </Fab>
                </LetterModal>
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
                                    Numero / Data
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Remetente / Destinatário
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Usuário / Assunto
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
                        {allLetters
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((letter, index) => (
                                <StyledTableRow key={letter.id} hover>
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
                                                            fontSize: "38px",
                                                        }}
                                                    >
                                                        {letter && letter.number}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {letter.created_at && format(parseISO(letter.created_at), 'dd/MM/yyyy H:m:s')}
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
                                                        {letter && letter.sender.substring(0, 30).toUpperCase()}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {letter && letter.recipient.substring(0, 30).toUpperCase()}
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
                                                        {letter && letter.user.name.substring(0, 30)}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {letter && letter.subject_matter.substring(0, 40).toUpperCase()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>

                                                <Button title="Visualizar Ofício" onClick={() => { HandleViewLetter(letter) }} color="success" size="medium" variant="contained">
                                                    <FeatherIcon icon="eye" width="20" height="20" />
                                                </Button>

                                                <Button title="Editar Ofício" onClick={() => { HandleEditLetter(letter) }} color="primary" size="medium" variant="contained"
                                                    disabled={profile != "admin" && letter.id_user != user}>
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>

                                                <Button title="Excluir Ofício" onClick={() => { HandleInactiveLetter(letter) }} color="error" size="medium" variant="contained"
                                                    disabled={letter.id_user == user || profile == "admin" ? allLetters.length - index !== allLetters.length : true}>
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
                    count={allLetters.length}
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
