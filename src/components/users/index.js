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

import { useSelector, useDispatch } from "react-redux";
import { getAllUsers, inactiveUserFetch } from "../../store/fetchActions/user";
import { showUser } from "../../store/ducks/users";
import { changeTitleAlert, turnUserModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import { AuthContext } from "../../contexts/AuthContext";
import Router from "next/router";

const avatarColors = [
  "linear-gradient(135deg,#10B981,#059669)",
  "linear-gradient(135deg,#3B82F6,#2563EB)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#EC4899,#DB2777)",
  "linear-gradient(135deg,#8B5CF6,#7C3AED)",
  "linear-gradient(135deg,#14B8A6,#0D9488)",
  "linear-gradient(135deg,#F97316,#EA580C)",
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const getAvatarColor = (name = "") => {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
};

const getRoleBadgeClass = (role = "") => {
  const normalized = role.toLowerCase();
  if (normalized === "driver") return "role-badge role-badge--driver";
  if (normalized === "visa") return "role-badge role-badge--visa";
  return "role-badge role-badge--user";
};

const StyledTableRow = styled(TableRow)({
  borderBottom: "0.5px solid var(--lg-border-row)",
  transition: "background 0.12s ease",
  "&:hover": {
    background: "var(--lg-glass-row-hover)",
  },
  "&:last-child td, &:last-child th": {
    borderBottom: "none",
  },
});

const StyledTableCell = styled(TableCell)({
  padding: "13px 18px",
  verticalAlign: "middle",
  color: "var(--lg-text-primary)",
  fontSize: "13px",
  borderBottom: "0.5px solid var(--lg-border-row)",
});

export default function Users() {
  const { profile } = useContext(AuthContext);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "Deseja realmente excluir",
    subTitle: "Esta ação não poderá ser desfeita",
  });

  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const [searchValue, setSearchValue] = useState("");

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
      title: `Deseja realmente inativar o usuário ${user.name}?`,
      confirm: inactiveUserFetch(user),
    });
    dispatch(changeTitleAlert(`O usuário ${user.name} foi inativado com sucesso!`));
  };

  const handleSearchUsers = ({ target }) => {
    setSearchValue(target.value || "");
    setPage(0);
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    <BaseCard title="Usuários">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2,
        }}
      >
        <TextField
          className="search-input user-search"
          sx={{
            width: "100%",
            "& .MuiOutlinedInput-root": {
              background: "var(--lg-glass-input)",
              border: "0.5px solid var(--lg-border-input)",
              borderRadius: "11px",
              color: "var(--lg-text-primary)",
              backdropFilter: "var(--lg-blur-input)",
              WebkitBackdropFilter: "var(--lg-blur-input)",
              boxShadow: "0 1px 3px rgba(var(--lg-accent-rgb), 0.06), 0 1px 0 rgba(255,255,255,0.12) inset",
              "& fieldset": { border: "none" },
              "&:hover": { background: "var(--lg-glass-input-focus)" },
              "&.Mui-focused": {
                boxShadow: "var(--lg-focus-ring)",
                background: "var(--lg-glass-input-focus)",
              },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "var(--lg-text-muted)",
              opacity: 1,
            },
          }}
          placeholder="Pesquisar usuários"
          name="search"
          value={searchValue}
          onChange={handleSearchUsers}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FeatherIcon icon="search" width="16" height="16" color="var(--lg-text-muted)" />
              </InputAdornment>
            ),
          }}
        />

        <Fab
          className="btn-add-user"
          onClick={() => {
            dispatch(turnUserModal());
          }}
          aria-label="add"
          sx={{
            width: "42px",
            height: "42px",
            minHeight: "42px",
            background: "linear-gradient(135deg, var(--lg-accent), #6D28D9)",
            color: "#fff",
            boxShadow: "var(--lg-shadow-btn)",
            "&:hover": {
              background: "linear-gradient(135deg, var(--lg-accent-hover), #7C3AED)",
              boxShadow: "var(--lg-shadow-btn-hover)",
              transform: "translateY(-1px)",
            },
          }}
        >
          <FeatherIcon icon="user-plus" width="18" height="18" />
        </Fab>
      </Box>

      <TableContainer
        className="users-table table-container"
        sx={{
          mt: 2,
          background: "var(--lg-glass-panel)",
          backdropFilter: "var(--lg-blur-panel)",
          WebkitBackdropFilter: "var(--lg-blur-panel)",
          border: "0.5px solid var(--lg-border)",
          borderTop: "1px solid var(--lg-border-strong)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "var(--lg-shadow-panel)",
        }}
      >
        <Table aria-label="tabela de usuários" sx={{ whiteSpace: "nowrap" }}>
          <TableHead
            sx={{
              background: "var(--lg-glass-table-head)",
              borderBottom: "0.5px solid var(--lg-border-row)",
            }}
          >
            <TableRow>
              <TableCell sx={{ py: 1.3, px: 2.2, borderBottom: "0.5px solid var(--lg-border-row)" }}>
                <Typography sx={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", color: "var(--lg-text-muted)", textTransform: "uppercase" }}>
                  Nome
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 1.3, px: 2.2, borderBottom: "0.5px solid var(--lg-border-row)" }}>
                <Typography sx={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", color: "var(--lg-text-muted)", textTransform: "uppercase" }}>
                  CPF / E-mail
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ py: 1.3, px: 2.2, borderBottom: "0.5px solid var(--lg-border-row)" }}>
                <Typography sx={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", color: "var(--lg-text-muted)", textTransform: "uppercase" }}>
                  Ações
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
                    <StyledTableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Box
                          className="user-avatar-initials"
                          sx={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "9px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#fff",
                            flexShrink: 0,
                            boxShadow: "var(--lg-shadow-avatar)",
                            background: getAvatarColor(user?.name || ""),
                          }}
                        >
                          {getInitials(user?.name || "")}
                        </Box>

                        <Box>
                          <Typography className="user-name" sx={{ fontSize: "13px", fontWeight: 500, color: "var(--lg-text-primary)", lineHeight: 1.3 }}>
                            {user?.name ? user.name.toUpperCase() : ""}
                          </Typography>
                          <Box sx={{ mt: 0.3 }}>
                            <span className={getRoleBadgeClass(user?.profile || "")}>
                              {(user?.profile || "user").toUpperCase()}
                            </span>
                          </Box>
                        </Box>
                      </Box>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Box>
                        <Typography className="user-cpf" sx={{ fontSize: "12px", fontWeight: 500, color: "var(--lg-text-secondary)" }}>
                          {user?.cpf || "-"}
                        </Typography>
                        <Typography className="user-email" sx={{ fontSize: "11px", color: "var(--lg-text-muted)", mt: 0.2 }}>
                          {user?.email || "-"}
                        </Typography>
                      </Box>
                    </StyledTableCell>

                    <StyledTableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                        <Button
                          className="btn-icon btn-icon--edit"
                          title="Editar usuário"
                          onClick={() => {
                            handleEditUser(user);
                          }}
                          sx={{
                            minWidth: "30px",
                            width: "30px",
                            height: "30px",
                            p: 0,
                            borderRadius: "8px",
                            border: "0.5px solid rgba(var(--lg-accent-rgb), 0.2)",
                            background: "rgba(var(--lg-accent-rgb), 0.08)",
                            color: "var(--lg-accent)",
                            backdropFilter: "blur(8px)",
                            "&:hover": {
                              background: "rgba(var(--lg-accent-rgb), 0.18)",
                              transform: "scale(1.07)",
                            },
                          }}
                        >
                          <FeatherIcon icon="edit" width="14" height="14" />
                        </Button>

                        <Button
                          className="btn-icon btn-icon--delete"
                          title="Inativar usuário"
                          onClick={() => {
                            handleInactiveUser(user);
                          }}
                          sx={{
                            minWidth: "30px",
                            width: "30px",
                            height: "30px",
                            p: 0,
                            borderRadius: "8px",
                            border: "0.5px solid rgba(var(--lg-danger-rgb), 0.2)",
                            background: "rgba(var(--lg-danger-rgb), 0.07)",
                            color: "var(--lg-danger)",
                            backdropFilter: "blur(8px)",
                            "&:hover": {
                              background: "rgba(var(--lg-danger-rgb), 0.16)",
                              transform: "scale(1.07)",
                            },
                          }}
                        >
                          <FeatherIcon icon="trash" width="14" height="14" />
                        </Button>
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography sx={{ color: "var(--lg-text-muted)" }}>Nenhum registro encontrado.</Typography>
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
          sx={{
            borderTop: "0.5px solid var(--lg-border-row)",
            color: "var(--lg-text-secondary)",
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              fontSize: "12px",
              color: "var(--lg-text-secondary)",
            },
            "& .MuiIconButton-root": {
              color: "var(--lg-text-secondary)",
            },
          }}
        />
      </TableContainer>

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </BaseCard>
  );
}
