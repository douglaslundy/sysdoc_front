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

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
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
    <Box sx={modalFormRootSx}>
      <BaseCard title={`Voce possui ${filteredUsers.length} Usuarios Cadastrados`}>
        <AlertModal />

        <Box
          sx={{
            "& > :not(style)": { m: 2 },
            display: "flex",
            justifyContent: "stretch",
          }}
        >
          <TextField
            className="lg-search-field"
            sx={{ width: "100%" }}
            placeholder="Pesquisar usuario: Nome / E-mail / CPF"
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
          />
        </Box>

        <TableContainer>
          <Table
            aria-label="tabela de usuarios"
            sx={{
              mt: 3,
              whiteSpace: "nowrap",
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Nome / Perfil
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    CPF / E-mail
                  </Typography>
                </TableCell>
                <TableCell align="center">
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
                        <Box sx={{ "& button": { mx: 1 } }}>
                          <ActionEditButton
                            title="Editar usuario"
                            onClick={() => {
                              handleEditUser(user);
                            }}
                          />

                          <ActionDeleteButton
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
  );
}
