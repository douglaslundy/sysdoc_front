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
// import ModelModal from "../modal/model";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllModels} from "../../store/fetchActions/models";
import { showModel } from "../../store/ducks/models";
import { turnModal } from "../../store/ducks/Layout";
import Router from "next/router";

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
   
    const dispatch = useDispatch();
    const { models, model } = useSelector(state => state.models);
    const [searchValue, setSearchValue] = useState();
    const [allModels, setAllModels] = useState(models);
    const { user, profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllModels());
    }, []);

    useEffect(() => {
        setAllModels(searchValue ? [...models.filter(lett => lett.number.toString().includes(searchValue.toString()))] : models);
    }, [models]);

    useEffect(() => {

        if (profile == "user") {
            Router.push('/');
        }
    }, []);


    const HandleViewModel = async model => {
        dispatch(showModel(model));
        dispatch(turnModal());
    }

    const HandleEditModel = async model => {
        dispatch(showModel(model));
        dispatch(turnModal());
    }

    const searchmodels = ({ target }) => {
        setSearchValue(target.value);
        setAllModels([...models.filter(lett => lett.number.toString().includes(target.value.toString()))]);
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
        <BaseCard title={`Foram gerados ${allModels.length} Modelos com a Inteligência Artificial`}>
            <AlertModal />
            
            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>
                 
                <TextField
                    sx={{ width: "85%" }}
                    label="Pesquisar um modelo criado"
                    name="search"
                    value={searchValue}
                    onChange={searchmodels}

                />

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
                                    Usuário / Data
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Remetente / Destinatário
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography color="textSecondary" variant="h6">
                                    Resumo / Modelo Criado
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
                        {allModels
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((model, index) => (
                                <StyledTableRow key={model.id} hover>
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
                                                            fontSize: "16px",
                                                        }}
                                                    >
                                                        {model && model.user.name.substring(0, 30)}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {model && format(parseISO(model.created_at), 'dd/MM/yyyy H:m:s')}
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
                                                        {model.sender && model.sender.substring(0, 30).toUpperCase()}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {model.recipient && model.recipient.substring(0, 30).toUpperCase()}
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
                                                        {model.summary && model.summary.substring(0, 30)}
                                                    </Typography>
                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {model.model && model.model.substring(0, 40).toUpperCase()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }}>

                                                <Button title="Visualizar Ofício" onClick={() => { HandleViewModel(model) }} color="success" size="medium" variant="contained">
                                                    <FeatherIcon icon="eye" width="20" height="20" />
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
                    count={allModels.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>          
        </BaseCard >
    );
};
