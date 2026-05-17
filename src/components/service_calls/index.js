import React, { useState, useEffect, useContext, useMemo } from "react";
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
  TextField,
  InputAdornment,
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
import ServiceModal from "../modal/service_calls";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from "react-redux";
import { getAllServices, inactiveServiceFetch } from "../../store/fetchActions/service_calls";
import { showService } from "../../store/ducks/service_calls";
import { changeTitleAlert, turnModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { useRouter } from "next/router";
import { addCalls } from "../../store/ducks/calls";
import { parseISO, format } from "date-fns";
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

export default function ServiceCalls() {
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "Deseja realmente excluir",
    subTitle: "Esta acao nao podera ser desfeita",
  });

  const dispatch = useDispatch();
  const { services } = useSelector((state) => state.services);
  const [searchValue, setSearchValue] = useState("");
  const { user, profile } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    dispatch(getAllServices());
  }, [dispatch]);

  const allServices = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) return services;
    return services.filter(
      (serv) =>
        (serv?.name || "").toLowerCase().includes(term) ||
        String(serv?.id || "").includes(term) ||
        (serv?.number || "").toString().toLowerCase().includes(term)
    );
  }, [services, searchValue]);

  const handleEditService = (service) => {
    dispatch(showService(service));
    dispatch(turnModal());
  };

  const handleGoCalls = (calls) => {
    dispatch(addCalls(calls));
    router.push("/listing_calls");
  };

  const handleInactiveService = (service) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja realmente excluir o servico ${service.name}?`,
      confirm: inactiveServiceFetch(service),
    });
    dispatch(changeTitleAlert(`O servico ${service.name} foi excluido com sucesso!`));
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const statusCount = (calls, status) => calls?.filter((a) => a.status === status).length || 0;

  return (
    <Box sx={modalFormRootSx}>
      <BaseCard title={`Voce possui ${allServices.length} Servicos Cadastrados`}>
        <AlertModal />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
          }}
        >
          <TextField
            className="lg-search-field"
            sx={{ width: "100%" }}
            placeholder="Pesquisar servico: Nome, Numero ou ID"
            name="search"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value || "");
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FeatherIcon icon="search" width="16" height="16" color="var(--lg-text-muted)" />
                </InputAdornment>
              ),
            }}
          />

          <ServiceModal>
            <Fab onClick={() => dispatch(turnModal())} color="primary" aria-label="add">
              <FeatherIcon icon="plus" />
            </Fab>
          </ServiceModal>
        </Box>

        <TableContainer>
          <Table aria-label="servicos" sx={{ mt: 3, whiteSpace: "nowrap" }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">ID</Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">Nome / Descricao</Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">Atendimentos</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography color="textSecondary" variant="h6">Acoes</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allServices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((service) => (
                  <StyledTableRow key={service.id} hover>
                    <TableCell>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "20px" }}>
                        {service?.id}
                      </Typography>
                      <Typography color="textSecondary" sx={{ fontSize: "13px" }}>
                        {service?.created_at ? format(parseISO(service.created_at), "dd/MM/yyyy HH:mm:ss") : ""}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {service?.name ? service.name.substring(0, 30).toUpperCase() : ""}
                      </Typography>
                      <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                        {service?.description ? service.description.substring(0, 40).toUpperCase() : ""}
                      </Typography>
                    </TableCell>

                    <TableCell align="left">
                      <Box sx={{ "& button": { mx: 0.5, my: 0.4 } }}>
                        <Button
                          title="Atendimentos em espera"
                          onClick={() => handleGoCalls(service.calls.filter((a) => a.status === "NOT_STARTED"))}
                          color="warning"
                          size="small"
                          variant="contained"
                          disabled={profile !== "admin" && service.id_user !== user}
                        >
                          <FeatherIcon icon="alert-triangle" width="16" height="16" />
                          <div style={{ marginLeft: "5px" }}>{statusCount(service.calls, "NOT_STARTED")}</div>
                        </Button>

                        <Button
                          title="Atendimentos em progresso"
                          onClick={() => handleGoCalls(service.calls.filter((a) => a.status === "IN_PROGRESS"))}
                          color="primary"
                          size="small"
                          variant="contained"
                          disabled={profile !== "admin" && service.id_user !== user}
                        >
                          <FeatherIcon icon="clock" width="16" height="16" />
                          <div style={{ marginLeft: "5px" }}>{statusCount(service.calls, "IN_PROGRESS")}</div>
                        </Button>

                        <Button
                          title="Atendimentos finalizados"
                          onClick={() => handleGoCalls(service.calls.filter((a) => a.status === "CLOSED"))}
                          color="success"
                          size="small"
                          variant="contained"
                          disabled={profile !== "admin" && service.id_user !== user}
                        >
                          <FeatherIcon icon="smile" width="16" height="16" />
                          <div style={{ marginLeft: "5px" }}>{statusCount(service.calls, "CLOSED")}</div>
                        </Button>

                        <Button
                          title="Desistencias"
                          onClick={() => handleGoCalls(service.calls.filter((a) => a.status === "ABANDONED"))}
                          color="error"
                          size="small"
                          variant="contained"
                          disabled={profile !== "admin" && service.id_user !== user}
                        >
                          <FeatherIcon icon="frown" width="16" height="16" />
                          <div style={{ marginLeft: "5px" }}>{statusCount(service.calls, "ABANDONED")}</div>
                        </Button>
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ "& button": { mx: 1 } }}>
                        <Button
                          title="Editar Servico"
                          onClick={() => handleEditService(service)}
                          color="primary"
                          size="medium"
                          variant="contained"
                          disabled={profile !== "admin" && service.id_user !== user}
                        >
                          <FeatherIcon icon="edit" width="20" height="20" />
                        </Button>

                        <Button
                          title="Excluir Servico"
                          onClick={() => handleInactiveService(service)}
                          color="error"
                          size="medium"
                          variant="contained"
                          disabled={profile !== "admin" && service.id_user !== user}
                        >
                          <FeatherIcon icon="trash" width="20" height="20" />
                        </Button>
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))}
              {allServices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">Nenhum registro encontrado!</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={allServices.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>

        <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
      </BaseCard>
    </Box>
  );
}

