import React, { useEffect, useRef, useState } from "react";
import {
  Typography,
  Box,
  Fab,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  styled,
  InputAdornment,
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
import ClientModal from "../modal/client";
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";
import { useSelector, useDispatch } from "react-redux";
import {
  getAllClients,
  inactiveClientFetch,
  viewClientFetch,
} from "../../store/fetchActions/clients";
import { changeTitleAlert, turnModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { parseISO, format } from "date-fns";

const safeText = (value, max = 30) => {
  if (!value) return "-";
  return String(value).substring(0, max).toUpperCase();
};

const StyledTableRow = styled(TableRow)(() => ({
  "& td": {
    background: "var(--queue-row-bg)",
    borderTop: "0.5px solid var(--lg-border)",
    borderBottom: "0.5px solid var(--lg-border)",
    paddingTop: 12,
    paddingBottom: 12,
    color: "var(--queue-text-primary)",
  },
  "& td:first-of-type": {
    borderLeft: "0.5px solid var(--lg-border)",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  "& td:last-of-type": {
    borderRight: "0.5px solid var(--lg-border)",
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  "&:hover td": {
    background: "var(--queue-row-hover)",
  },
}));

export default function Clients() {
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "Deseja realmente excluir",
    subTitle: "Esta acao nao podera ser desfeita",
  });

  const dispatch = useDispatch();
  const { clients, pagination } = useSelector((state) => state.clients);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const searchRef = useRef(null);

  const buildParams = (overrides = {}) => ({
    page: page + 1,
    per_page: rowsPerPage,
    search: searchValue || undefined,
    ...overrides,
  });

  const handleEditClient = (client) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja editar o cliente ${client.name}`,
      confirm: () => dispatch(viewClientFetch(client.id)),
    });
  };

  const handleInactiveClient = (client) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja realmente excluir o cliente ${client.name}`,
      confirm: inactiveClientFetch(client),
    });
    dispatch(changeTitleAlert(`O cliente ${client.name} foi inativado com sucesso!`));
  };

  const searchClients = ({ target }) => {
    const value = target.value;
    setSearchValue(value);
    setPage(0);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      dispatch(getAllClients(buildParams({ search: value || undefined, page: 1 })));
    }, 400);
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
    dispatch(getAllClients(buildParams({ page: newPage + 1 })));
  };

  const handleChangeRowsPerPage = (event) => {
    const value = parseInt(event.target.value, 10);
    setRowsPerPage(value);
    setPage(0);
    dispatch(getAllClients(buildParams({ per_page: value, page: 1 })));
  };

  useEffect(() => {
    dispatch(getAllClients({ page: 1, per_page: rowsPerPage }));
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, []);

  useEffect(() => {
    if (pagination?.current_page) {
      setPage(Math.max(0, pagination.current_page - 1));
    }
  }, [pagination?.current_page]);

  return (
    <Box sx={modalFormRootSx} className="queue-page clients-page">
      <BaseCard title={`Voce possui ${pagination?.total || clients.length} Clientes Cadastrados`}>
        <AlertModal />
        <Box className="queue-page__toolbar" sx={{ display: "flex", alignItems: "center", gap: 2.2, mb: 2.1 }}>
          <TextField
            className="lg-search-field"
            sx={{ width: "100%" }}
            placeholder="Pesquisar cliente: Nome / Telefone / CPF ou CNS"
            name="search"
            autoComplete="off"
            value={searchValue}
            onChange={searchClients}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FeatherIcon icon="search" width="22" height="22" />
                </InputAdornment>
              ),
            }}
          />

          <ClientModal>
            <Fab
              onClick={() => {
                dispatch(turnModal());
              }}
              color="primary"
              aria-label="add"
              className="queue-page__fab queue-page__fab--add"
              sx={{ width: 62, height: 62, borderRadius: "14px" }}
            >
              <FeatherIcon icon="user-plus" />
            </Fab>
          </ClientModal>
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table
            aria-label="clientes"
            className="queue-page__table"
            sx={{ mt: 2, whiteSpace: "nowrap", borderCollapse: "separate", borderSpacing: "0 10px" }}
          >
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th">
                  <Typography color="textSecondary" variant="h6">Nome / DN</Typography>
                </TableCell>
                <TableCell className="queue-page__th">
                  <Typography color="textSecondary" variant="h6">Mae / CPF / CNS</Typography>
                </TableCell>
                <TableCell className="queue-page__th">
                  <Typography color="textSecondary" variant="h6">Telefone / Endereco</Typography>
                </TableCell>
                <TableCell align="center" className="queue-page__th">
                  <Typography color="textSecondary" variant="h6">Acoes</Typography>
                </TableCell>
              </TableRow>
            </TableHead>

            {clients.length >= 1 ? (
              <TableBody>
                {clients.map((client) => (
                  <StyledTableRow key={client.id} hover>
                    <TableCell>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {safeText(client?.name, 35)}
                      </Typography>
                      <Typography color="textSecondary" sx={{ fontSize: "13px" }}>
                        {client?.born_date ? format(parseISO(client.born_date), "dd/MM/yyyy") : "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {safeText(client?.mother, 30)}
                      </Typography>
                      <Typography color="textSecondary" sx={{ fontSize: "13px" }}>{client?.cpf || "-"}</Typography>
                      <Typography color="textSecondary" sx={{ fontSize: "13px" }}>{client?.cns || "-"}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="h6">{client?.phone || "-"}</Typography>
                      <Typography variant="h6">
                        {safeText(client?.addresses?.street, 30)}, N {client?.addresses?.number || "-"}
                      </Typography>
                      <Typography variant="h6">{safeText(client?.addresses?.district, 30)}</Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Box className="queue-page__actions" sx={{ "& button": { mx: 1 } }}>
                        <Button
                          className="queue-page__action queue-page__action--success"
                          title="Editar cliente"
                          onClick={() => handleEditClient(client)}
                          color="success"
                          size="medium"
                          variant="contained"
                          sx={{ minWidth: 62, height: 40 }}
                        >
                          <FeatherIcon icon="edit" width="20" height="20" />
                        </Button>
                        <Button
                          className="queue-page__action queue-page__action--danger"
                          title="Excluir cliente"
                          onClick={() => handleInactiveClient(client)}
                          color="error"
                          size="medium"
                          variant="contained"
                          sx={{ minWidth: 62, height: 40 }}
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
            className="queue-page__pagination"
            component="div"
            count={pagination?.total ?? clients.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>

        <ConfirmDialog
          confirmDialog={confirmDialog}
          setConfirmDialog={setConfirmDialog}
          isAuthenticated
        />
      </BaseCard>
    </Box>
  );
}
