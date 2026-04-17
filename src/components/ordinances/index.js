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
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const dispatch = useDispatch();
    const { ordinances } = useSelector(state => state.ordinances);
    const [searchValue, setSearchValue] = useState("");
    const [allOrdinances, setAllOrdinances] = useState(ordinances);
    const { user, profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllOrdinances());
    }, []);

    useEffect(() => {
        setAllOrdinances([...ordinances]);
    }, [ordinances]);

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
            ...ordinances.filter(item =>
                item.number && item.number.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                item.title && item.title.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                item.subject && item.subject.toString().toLowerCase().includes(target.value.toString().toLowerCase()) ||
                item.signatory_name && item.signatory_name.toString().toLowerCase().includes(target.value.toString().toLowerCase())
            )
        ]);
    };

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    return (
        <BaseCard title={`Você possui ${allOrdinances.length} portarias cadastradas`}>
            <AlertModal />
            <ViewOrdinanceModal />

            <Box sx={{ '& > :not(style)': { mb: 0, mt: 2 }, display: 'flex', justifyContent: 'space-between' }}>
                <TextField
                    sx={{ width: "80%" }}
                    label="Pesquisar portaria"
                    name="search"
                    value={searchValue}
                    onChange={searchOrdinances}
                />

                <OrdinanceModal>
                    <Fab onClick={() => { dispatch(turnModal()) }} color="primary" aria-label="add">
                        <FeatherIcon icon="plus" />
                    </Fab>
                </OrdinanceModal>
            </Box>

            <TableContainer>
                <Table aria-label="simple table" sx={{ mt: 3, whiteSpace: "nowrap" }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">Número / Data</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">Título / Assunto</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">Usuário / Tipo</Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography color="textSecondary" variant="h6">Ações</Typography>
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
                                            <Typography variant="h6" sx={{ fontWeight: "600", fontSize: "38px" }}>
                                                {ordinance.number}
                                            </Typography>
                                            <Typography color="textSecondary" sx={{ fontSize: "13px" }}>
                                                {ordinance.created_at && format(parseISO(ordinance.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="h6" sx={{ fontWeight: "600" }}>
                                                {ordinance.title?.substring(0, 40).toUpperCase()}
                                            </Typography>
                                            <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                                                {ordinance.subject?.substring(0, 50).toUpperCase()}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="h6" sx={{ fontWeight: "600" }}>
                                                {ordinance.user?.name?.substring(0, 30).toUpperCase()}
                                            </Typography>
                                            <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                                                {ordinance.type?.toUpperCase()}
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>
                                                <Button title="Visualizar Portaria" onClick={() => HandleViewOrdinance(ordinance)} color="success" size="medium" variant="contained">
                                                    <FeatherIcon icon="eye" width="20" height="20" />
                                                </Button>

                                                <Button
                                                    title="Editar Portaria"
                                                    onClick={() => HandleEditOrdinance(ordinance)}
                                                    color="primary"
                                                    size="medium"
                                                    variant="contained"
                                                    disabled={profile != "admin" && ordinance.user_id != user}
                                                >
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>

                                                <Button
                                                    title="Excluir Portaria"
                                                    onClick={() => HandleInactiveOrdinance(ordinance)}
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
                        <TableCell align="center">Nenhum registro encontrado!</TableCell>
                    )}
                </Table>

                <TablePagination
                    component="div"
                    count={allOrdinances.length}
                    page={page}
                    onPageChange={(event, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>

            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </BaseCard>
    );
};