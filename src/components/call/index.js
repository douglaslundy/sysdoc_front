import React, { useState, useEffect, useContext } from "react";
import {
    Box,
    TableRow,
    Button,
    styled,
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import { getAllCalls, inactiveCallFetch } from "../../store/fetchActions/calls";
import { showCall } from "../../store/ducks/calls";
import { changeTitleAlert, turnModal, turnModalViewService } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";

import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";

import CreateCallModal from "../../components/modal/create_call";


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
    const { calls } = useSelector(state => state.calls);
    const [searchValue, setSearchValue] = useState();
    const [allCalls, setAllCalls] = useState(calls);
    const { user, profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllCalls());
    }, []);

    useEffect(() => {
        setAllCalls(searchValue ? [...calls.filter(serv => serv.number.toString().includes(searchValue.toString()))] : calls);
    }, [calls]);

    const HandleViewCall = async call => {
        dispatch(showCall(call));
        dispatch(turnModalViewCall());
    }

    const HandleEditCall = async call => {
        dispatch(showCall(call));
        dispatch(turnModal());
    }

    const HandleInactiveCall = async call => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir o Serviço ${call.name}`, confirm: inactiveCallFetch(call) })
        dispatch(changeTitleAlert(`O servico ${call.name} foi excluido com sucesso!`))
    }


    const searchcalls = ({ target }) => {
        setSearchValue(target.value);
        setAllCalls([...calls.filter(
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

    const handleStart = () => {
        dispatch(turnModal());
    }

    return (
        <BaseCard title={`Inserir no atendimento`}>
            <AlertModal />
            <Box sx={{
                '& > :not(style)': { m: 2 },
                'display': 'flex',
                'justify-content': 'stretch'
            }}>

            </Box>

            <CreateCallModal />

            <Button
                title="Criar atendimento"
                onClick={handleStart}
                color="primary"
                size="large"
                variant="contained"
                style={{ width: 300, fontSize: 50 }}
            >
                Iniciar
            </Button>

            <ConfirmDialog
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog} />

        </BaseCard >
    );
};
