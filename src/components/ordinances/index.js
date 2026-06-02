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
import { ActionCreateFab } from "../actions";
import OrdinanceModal from "../modal/ordinance";
import ViewOrdinanceModal from "../modal/ordinance/view";
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllOrdinances, inactiveOrdinanceFetch } from "../../store/fetchActions/ordinances";
import { showOrdinance } from "../../store/ducks/ordinances";
import { changeTitleAlert, turnModal, turnModalViewLetter } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import Select from '../inputs/selects';

import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";

const StyledTableRow = styled(TableRow)(() => ({
    '& td': {
        background: 'var(--queue-row-bg)',
        borderTop: '0.5px solid var(--lg-border)',
        borderBottom: '0.5px solid var(--lg-border)',
        paddingTop: 12,
        paddingBottom: 12,
        color: 'var(--queue-text-primary)',
    },
    '& td + td': {
        borderLeft: '0.5px solid rgba(114, 147, 222, 0.24)',
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
    '&:hover td': {
        background: 'var(--queue-row-hover)',
    },
}));

export default () => {
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
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

        dispatch(changeTitleAlert(`A Portaria ${ordinance.number} foi excluída com sucesso!`));
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
        <Box sx={modalFormRootSx} className="queue-page">
        <BaseCard title={`Você possui ${allOrdinances.length} portarias cadastradas`}>
            <AlertModal />
            <ViewOrdinanceModal />

            <Box className="queue-page__toolbar"
                sx={{
                    '& > :not(style)': { mb: 0, mt: 2 },
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 1,
                    flexWrap: 'wrap',
                }}
            >
                <TextField
                    className="lg-search-field"
                    sx={{ flex: 1, minWidth: 260 }}
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
                    <ActionCreateFab onClick={() => { dispatch(turnModal()) }} />
                </OrdinanceModal>
            </Box>

            <TableContainer className="queue-page__table-wrap">
                <Table className="queue-page__table"
                    aria-label="simple table"
                    sx={{
                        mt: 3,
                        whiteSpace: "nowrap",
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    Número / Data
                                </Typography>
                            </TableCell>
                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    Título / Assunto
                                </Typography>
                            </TableCell>
                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    Usuário / Tipo
                                </Typography>
                            </TableCell>
                            <TableCell className="queue-page__th" align="center">
                                <Typography color="textSecondary" variant="h6">
                                    Ações
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
                                                    color="success"
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

                <TablePagination className="queue-page__pagination"
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
        </Box>
    );
};
