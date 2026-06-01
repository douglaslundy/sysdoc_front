import React, { useState, useEffect, useContext } from "react";
import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    styled,
    TableContainer,
    TablePagination,
    TextField
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
import { ActionCreateFab, ActionDeleteButton, ActionEditButton, ActionViewButton } from "../actions";
import LetterModal from "../modal/letter";
import ViewLetterModal from "../modal/letter/view";
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllLetters, inactiveLetterFetch } from "../../store/fetchActions/letter";
import { showLetter } from "../../store/ducks/letters";
import { changeTitleAlert, turnModal, turnModalViewLetter } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import Select from '../inputs/selects';

import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";


const StyledTableRow = styled(TableRow)(() => ({
    '&:nth-of-type(odd)': {
        backgroundColor: 'var(--lg-glass-row-hover)',
    },
    '& td': {
        background: 'var(--lg-glass-row)',
        borderTop: '0.5px solid var(--lg-border)',
        borderBottom: '0.5px solid var(--lg-border)',
        paddingTop: 12,
        paddingBottom: 12,
    },
    '& td:first-of-type': {
        borderLeft: '0.5px solid var(--lg-border)',
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    '& td:last-of-type': {
        borderRight: '0.5px solid var(--lg-border)',
        borderTopRightRadius: 14,
        borderBottomRightRadius: 14,
    },
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
    const { letters } = useSelector(state => state.letters);
    const [searchValue, setSearchValue] = useState();
    const [allLetters, setAllLetters] = useState(letters);
    const { user, profile } = useContext(AuthContext);

    const [year, setYear] = useState(new Date().getFullYear());
    const uniqueYears = Array.from(new Set(letters.map(item => new Date(item.created_at).getFullYear())));

    // Transforma a variável years em um array JSON
    const transformedYears = Object.values({ ...uniqueYears }).map(year => ({
        id: year,
        name: year,
    }));

    const changeYear = ({ target }) => {
        setYear(target.value)
    }


    useEffect(() => {
        dispatch(getAllLetters());
    }, []);

    useEffect(() => {
        setAllLetters([...letters.filter(lett => new Date(lett.created_at).getFullYear() == year)]);
    }, [year]);

    useEffect(() => {
        // executado apenas quando é carregado a página a primeira vez, ou quando é adicionado um registro 
        setAllLetters(searchValue ?
            [...letters.filter(lett => lett.number.toString().toLowerCase().includes(searchValue.toString().toLowerCase()))
                .filter(lett => new Date(lett.created_at).getFullYear() == year)]
            : [...letters.filter(lett => new Date(lett.created_at).getFullYear() == year)]);
    }, [letters]);



    const HandleViewLetter = async letter => {
        dispatch(showLetter(letter));
        dispatch(turnModalViewLetter());
    }

    const HandleEditLetter = async letter => {
        dispatch(showLetter(letter));
        dispatch(turnModal());
    }

    const HandleInactiveLetter = async letter => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir o Ofício ${letter.number}`, confirm: inactiveLetterFetch(letter) })
        dispatch(changeTitleAlert(`O lettere ${letter.number} foi excluido com sucesso!`))
    }


    const searchLetters = ({ target }) => {
        setSearchValue(target.value);

        setAllLetters([...letters.filter(lett => new Date(lett.created_at).getFullYear() == year)
            .filter(
                lett => lett.number && lett.number.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                    lett.sender && lett.sender.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                    lett.recipient && lett.recipient.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                    lett.subject_matter && lett.subject_matter.toString().toLowerCase().includes(target.value.toString().toLowerCase())
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
        <Box sx={modalFormRootSx}>
        <BaseCard title={`Você possui ${allLetters.length} ofícios Cadastrados`}>
            <AlertModal />
            <ViewLetterModal />

            <Box sx={{
                '& > :not(style)': { mb: 0, mt: 2 },
                'display': 'flex',
                'justify-content': 'space-between',
                gap: 1,
                flexWrap: 'wrap',
            }}
            >

                <TextField
                    className="lg-search-field"
                    sx={{ flex: 1, minWidth: 260 }}
                    placeholder="Pesquisar ofício"
                    name="search"
                    value={searchValue}
                    onChange={searchLetters}

                />

                <Select
                    label="Ano"
                    name="year"
                    value={year}
                    store={transformedYears}
                    changeItem={changeYear}
                    wd={"20%"}
                />

                <LetterModal>
                    <ActionCreateFab onClick={() => { dispatch(turnModal()) }} />
                </LetterModal>
            </Box>

            <TableContainer>

                <Table
                    aria-label="simple table"
                    sx={{
                        mt: 3,
                        whiteSpace: "nowrap",
                        borderCollapse: 'separate',
                        borderSpacing: '0 10px',
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
                    {allLetters.length >= 1 ?
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
                                                            {letter.created_at && format(parseISO(letter.created_at), 'dd/MM/yyyy HH:mm:ss')}
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
                                                            {letter && letter.user.name.substring(0, 30).toUpperCase()}
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

                                                    <ActionViewButton title="Visualizar Ofício" onClick={() => { HandleViewLetter(letter) }} />

                                                    {Number(letter?.attachments_count || 0) > 0 && (
                                                        <Button
                                                            title={`${letter.attachments_count} anexo(s)`}
                                                            color="secondary"
                                                            size="medium"
                                                            variant="contained"
                                                            disabled
                                                        >
                                                            <FeatherIcon icon="paperclip" width="20" height="20" />
                                                        </Button>
                                                    )}

                                                    <ActionEditButton title="Editar Ofício" onClick={() => { HandleEditLetter(letter) }}
                                                        disabled={profile != "admin" && letter.id_user != user}>
                                                    </ActionEditButton>

                                                    <ActionDeleteButton title="Excluir Ofício" onClick={() => { HandleInactiveLetter(letter) }}
                                                        disabled={letter.id_user == user || profile == "admin" ? allLetters.length - index !== allLetters.length : true}>
                                                    </ActionDeleteButton>

                                                </Box>
                                            </TableCell>
                                        </>

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
        </Box>
    );
};
