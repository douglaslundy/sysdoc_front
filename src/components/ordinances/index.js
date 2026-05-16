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
import OrdinanceModal from "../modal/ordinance";
import ViewOrdinanceModal from "../modal/ordinance/view";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllOrdinances, inactiveOrdinanceFetch } from "../../store/fetchActions/ordinances";
import { showOrdinance } from "../../store/ducks/ordinances";
import { changeTitleAlert, turnModal, turnModalViewLetter } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import Select from '../inputs/selects';

import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

export default () => {
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta aÃ§Ã£o nÃ£o poderÃ¡ ser desfeita',
    });

    const dispatch = useDispatch();
    const { ordinances } = useSelector(state => state.ordinances);
    const [searchValue, setSearchValue] = useState("");
    const [allOrdinances, setAllOrdinances] = useState([]);
    const { user, profile } = useContext(AuthContext);

    const [year, setYear] = useState(new Date().getFullYear());

    const uniqueYears = Array.from(
        new Set(
            ordinances
                .filter(item => item.created_at)
                .map(item => new Date(item.created_at).getFullYear())
        )
    );

    const transformedYears = Object.values({ ...uniqueYears }).map(year => ({
        id: year,
        name: year,
    }));

    const changeYear = ({ target }) => {
        setYear(target.value);
    };

    useEffect(() => {
        dispatch(getAllOrdinances());
    }, []);

    useEffect(() => {
        setAllOrdinances([
            ...ordinances.filter(item => new Date(item.created_at).getFullYear() == year)
        ]);
    }, [year, ordinances]);

    useEffect(() => {
        setAllOrdinances(
            searchValue
                ? [
                    ...ordinances
                        .filter(item => new Date(item.created_at).getFullYear() == year)
                        .filter(item =>
                            item.number && item.number.toString().toLowerCase().includes(searchValue.toString().toLowerCase()) ||
                            item.title && item.title.toString().toLowerCase().includes(searchValue.toString().toLowerCase()) ||
                            item.subject && item.subject.toString().toLowerCase().includes(searchValue.toString().toLowerCase()) ||
                            item.summary && item.summary.toString().toLowerCase().includes(searchValue.toString().toLowerCase()) ||
                            item.content && item.content.toString().toLowerCase().includes(searchValue.toString().toLowerCase()) ||
                            item.legal_basis && item.legal_basis.toString().toLowerCase().includes(searchValue.toString().toLowerCase()) ||
                            item.signatory_name && item.signatory_name.toString().toLowerCase().includes(searchValue.toString().toLowerCase())
                        )
                ]
                : [
                    ...ordinances.filter(item => new Date(item.created_at).getFullYear() == year)
                ]
        );
    }, [searchValue, ordinances, year]);

    const HandleViewOrdinance = async ordinance => {
        dispatch(showOrdinance(ordinance));
        dispatch(turnModalViewLetter());
    };

    const HandleEditOrdinance = async ordinance => {
        dispatch(showOrdinance(ordinance));
        dispatch(turnModal());
    };

    const HandleInactiveOrdinance = async ordinance => {
        setConfirmDialog({
            ...confirmDialog,
            isOpen: true,
            title: `Deseja Realmente Excluir a Portaria ${ordinance.number}`,
            confirm: inactiveOrdinanceFetch(ordinance)
        });

        dispatch(changeTitleAlert(`A Portaria ${ordinance.number} foi excluÃ­da com sucesso!`));
    };

    const searchOrdinances = ({ target }) => {
        setSearchValue(target.value);

        setAllOrdinances([
            ...ordinances
                .filter(item => new Date(item.created_at).getFullYear() == year)
                .filter(item =>
                    item.number && item.number.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                    item.title && item.title.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                    item.subject && item.subject.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                    item.summary && item.summary.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                    item.content && item.content.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                    item.legal_basis && item.legal_basis.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                    item.signatory_name && item.signatory_name.toString().toLowerCase().includes(target.value.toString().toLowerCase())
                )
        ]);
    };

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
        <BaseCard title={`VocÃª possui ${allOrdinances.length} portarias cadastradas`}>
            <AlertModal />
            <ViewOrdinanceModal />

            <Box
                sx={{
                    '& > :not(style)': { mb: 0, mt: 2 },
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <TextField
                    sx={{ width: "65%" }}
                    placeholder="Pesquisar portaria"
                    name="search"
                    value={searchValue}
                    onChange={searchOrdinances}
                />

                <Select
                    label="Ano"
                    name="year"
                    value={year}
                    store={transformedYears}
                    changeItem={changeYear}
                    wd={"20%"}
                />

                <OrdinanceModal>
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add">
                        <FeatherIcon icon="plus" />
                    </Fab>
                </OrdinanceModal>
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
                                    NÃºmero / Data
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    TÃ­tulo / Assunto
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    UsuÃ¡rio / Tipo
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography color="textSecondary" variant="h6">
                                    AÃ§Ãµes
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    {allOrdinances.length >= 1 ? (
                        <TableBody>
                            {allOrdinances
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((ordinance, index) => (
                                    <StyledTableRow key={ordinance.id} hover>
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
                                                        {ordinance && ordinance.number}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {ordinance.created_at && format(parseISO(ordinance.created_at), 'dd/MM/yyyy HH:mm:ss')}
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
                                                        {ordinance && ordinance.title ? ordinance.title.substring(0, 40).toUpperCase() : ''}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {ordinance && ordinance.subject ? ordinance.subject.substring(0, 50).toUpperCase() : ''}
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
                                                        {ordinance && ordinance.user && ordinance.user.name
                                                            ? ordinance.user.name.substring(0, 30).toUpperCase()
                                                            : ''}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {ordinance && ordinance.type ? ordinance.type.toUpperCase() : ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>
                                                <Button
                                                    title="Visualizar Portaria"
                                                    onClick={() => { HandleViewOrdinance(ordinance) }}
                                                    color="success"
                                                    size="medium"
                                                    variant="contained"
                                                >
                                                    <FeatherIcon icon="eye" width="20" height="20" />
                                                </Button>

                                                {Number(ordinance?.attachments_count || 0) > 0 && (
                                                    <Button
                                                        title={`${ordinance.attachments_count} anexo(s)`}
                                                        color="secondary"
                                                        size="medium"
                                                        variant="contained"
                                                        disabled
                                                    >
                                                        <FeatherIcon icon="paperclip" width="20" height="20" />
                                                    </Button>
                                                )}

                                                <Button
                                                    title="Editar Portaria"
                                                    onClick={() => { HandleEditOrdinance(ordinance) }}
                                                    color="primary"
                                                    size="medium"
                                                    variant="contained"
                                                    disabled={profile != "admin" && ordinance.user_id != user}
                                                >
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>

                                                <Button
                                                    title="Excluir Portaria"
                                                    onClick={() => { HandleInactiveOrdinance(ordinance) }}
                                                    color="error"
                                                    size="medium"
                                                    variant="contained"
                                                    disabled={ordinance.user_id == user || profile == "admin" ? allOrdinances.length - index !== allOrdinances.length : true}
                                                >
                                                    <FeatherIcon icon="trash" width="20" height="20" />
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </StyledTableRow>
                                ))}
                        </TableBody>
                    ) : (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    Nenhum registro encontrado!
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    )}
                </Table>

                <TablePagination
                    component="div"
                    count={allOrdinances.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            <ConfirmDialog
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog}
            />
        </BaseCard>
    );
};


