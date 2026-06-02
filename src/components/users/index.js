import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  styled,
  TableContainer,
  TablePagination,
  TextField,
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
import { ActionCreateFab, ActionDeleteButton, ActionEditButton } from "../actions";

import { useSelector, useDispatch } from "react-redux";
import { getAllUsers, inactiveUserFetch } from "../../store/fetchActions/user";
import { showUser } from "../../store/ducks/users";
import { changeTitleAlert, turnUserModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";
import { AuthContext } from "../../contexts/AuthContext";
import Router from "next/router";

const StyledTableRow = styled(TableRow)(() => ({
  '& td': {
    background: 'var(--queue-row-bg)',
    borderTop: '0.5px solid var(--lg-border)',
    borderBottom: '0.5px solid var(--lg-border)',
    paddingTop: 12,
    paddingBottom: 12,
    color: 'var(--queue-text-primary)',
  },
  '& td:first-of-type': { borderLeft: '0.5px solid var(--lg-border)', borderRadius: '14px 0 0 14px' },
  '& td:last-of-type': { borderRight: '0.5px solid var(--lg-border)', borderRadius: '0 14px 14px 0' },
  '&:hover td': {
    background: 'var(--queue-row-hover)',
  },
}));

export default function Users() {
  const { profile } = useContext(AuthContext);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "Deseja realmente excluir",
    subTitle: "Esta acao nao podera ser desfeita",
  });

  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const [searchValue, setSearchValue] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) return users;

    return users.filter((u) => {
      const name = (u?.name || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      const cpf = (u?.cpf || "").toLowerCase();
      return name.includes(term) || email.includes(term) || cpf.includes(term);
    });
  }, [users, searchValue]);

  const handleEditUser = async (user) => {
    dispatch(showUser(user));
    dispatch(turnUserModal());
  };

  const handleInactiveUser = async (user) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja realmente inativar o usuario ${user.name}?`,
      confirm: inactiveUserFetch(user),
    });
    dispatch(changeTitleAlert(`O usuario ${user.name} foi inativado com sucesso!`));
  };

  const handleSearchUsers = ({ target }) => {
    setSearchValue(target.value || "");
    setPage(0);
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (profile !== "admin" && profile !== "user") {
      Router.push("/");
    }
  }, [profile]);

  return (
    <Box className="queue-page users-page" sx={modalFormRootSx}>
      <Box>
      <BaseCard title={`Você possui ${filteredUsers.length} Usuários Cadastrados`}>
        <AlertModal />

        <Box className="queue-page__toolbar" sx={{ display: "flex", alignItems: "center", gap: 1.4, mb: 1.2 }}>
          <TextField
            className="lg-search-field users-page__search"
            sx={{ width: "100%" }}
            placeholder="Pesquisar usuário: Nome / E-mail / CPF"
            name="search"
            autoComplete="off"
            value={searchValue}
            onChange={handleSearchUsers}
          />

          <ActionCreateFab
            icon="user-plus"
            onClick={() => {
              dispatch(turnUserModal());
            }}
            sx={{ width: 56, height: 56, boxShadow: "0 0 20px rgba(124,58,237,0.45)" }}
            className="queue-page__fab queue-page__fab--add"
          />
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table
            aria-label="tabela de usuarios"
            className="queue-page__table"
            sx={{ mt: 2, whiteSpace: "nowrap", borderCollapse: "separate", borderSpacing: "0 10px" }}
          >
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th">
                  <Typography color="textSecondary" variant="h6">
                    Nome / Perfil
                  </Typography>
                </TableCell>
                <TableCell className="queue-page__th">
                  <Typography color="textSecondary" variant="h6">
                    CPF / E-mail
                  </Typography>
                </TableCell>
                <TableCell align="center" className="queue-page__th">
                  <Typography color="textSecondary" variant="h6">
                    Acoes
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>

            {filteredUsers.length >= 1 ? (
              <TableBody>
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <StyledTableRow key={user?.id} hover>
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
                              }}
                            >
                              {user?.name ? user.name.toUpperCase() : ""}
                            </Typography>
                            <Typography
                              color="textSecondary"
                              sx={{
                                fontSize: "12px",
                              }}
                            >
                              {(user?.profile || "user").toUpperCase()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography
                          color="textSecondary"
                          sx={{
                            fontSize: "12px",
                          }}
                        >
                          {user?.cpf || "-"}
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: "12px" }}>
                          {user?.email || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ "& button": { mx: 1 } }} className="queue-page__actions">
                          <ActionEditButton
                            className="queue-page__action queue-page__action--success"
                            title="Editar usuario"
                            onClick={() => {
                              handleEditUser(user);
                            }}
                          />

                          <ActionDeleteButton
                            className="queue-page__action queue-page__action--danger"
                            title="Inativar usuario"
                            onClick={() => {
                              handleInactiveUser(user);
                            }}
                          />
                        </Box>
                      </TableCell>
                    </StyledTableRow>
                  ))}
              </TableBody>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    Nenhum registro encontrado!
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>

          <TablePagination
            className="queue-page__pagination"
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>

        <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
      </BaseCard>
      </Box>
    </Box>
  );
}


