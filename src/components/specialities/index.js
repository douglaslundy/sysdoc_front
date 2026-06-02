import React, { useState, useEffect, useContext } from "react";
import {
  Typography,
  Box,
  Fab,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  styled,
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
import SpecialityModal from "../modal/specialities";
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";
import { AuthContext } from "../../contexts/AuthContext";
import { useSelector, useDispatch } from "react-redux";
import {
  getAllSpecialities,
  inactiveSpecialityFetch,
} from "../../store/fetchActions/specialities";
import { showSpeciality } from "../../store/ducks/specialities";
import { changeTitleAlert, turnModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { parseISO, format } from "date-fns";

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

export default function Specialities() {
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "Deseja realmente excluir",
    subTitle: "Esta acao nao podera ser desfeita",
  });

  const dispatch = useDispatch();
  const { specialities } = useSelector((state) => state.specialities);
  const [searchValue, setSearchValue] = useState("");
  const [allSpecialities, setAllSpecialities] = useState(specialities);
  const { user, profile } = useContext(AuthContext);

  useEffect(() => {
    dispatch(getAllSpecialities());
  }, []);

  useEffect(() => {
    setAllSpecialities(
      searchValue
        ? [
            ...specialities.filter(
              (speciality) =>
                speciality.name &&
                speciality.name.toString().toLowerCase().includes(searchValue.toString().toLowerCase())
            ),
          ]
        : specialities
    );
  }, [specialities, searchValue]);

  const handleEditSpeciality = (speciality) => {
    dispatch(showSpeciality(speciality));
    dispatch(turnModal());
  };

  const handleInactiveSpeciality = (speciality) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja realmente excluir a sala ${speciality.name}`,
      confirm: inactiveSpecialityFetch(speciality),
    });
    dispatch(changeTitleAlert(`A especialidade ${speciality.name} foi excluida com sucesso!`));
  };

  const searchSpecialities = ({ target }) => {
    setSearchValue(target.value || "");
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

  return (
    <Box sx={modalFormRootSx} className="queue-page specialities-page">
      <BaseCard title={`Voce possui ${allSpecialities.length} Especialidades Cadastradas`}>
        <AlertModal />
        <Box
          className="queue-page__toolbar"
          sx={{
            "& > :not(style)": { m: 0 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <TextField
            className="lg-search-field"
            sx={{ flex: 1, minWidth: 260 }}
            placeholder="Pesquisar especialidade"
            name="search"
            value={searchValue}
            onChange={searchSpecialities}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FeatherIcon icon="search" width="22" height="22" />
                </InputAdornment>
              ),
            }}
            inputProps={{ maxLength: 50, autoComplete: "off" }}
          />

          <SpecialityModal>
            <Fab
              className="queue-page__fab queue-page__fab--add"
              onClick={() => {
                dispatch(turnModal());
              }}
              color="primary"
              aria-label="add"
              sx={{ width: 62, height: 62, borderRadius: "14px" }}
            >
              <FeatherIcon icon="user-plus" />
            </Fab>
          </SpecialityModal>
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table
            aria-label="specialities"
            className="queue-page__table"
            sx={{ mt: 2, whiteSpace: "nowrap", borderCollapse: "separate", borderSpacing: "0 10px" }}
          >
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">ID</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Nome</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Usuario cadastrador</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Criado em</Typography></TableCell>
                <TableCell align="center" className="queue-page__th"><Typography color="textSecondary" variant="h6">Acoes</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allSpecialities
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((speciality) => (
                  <StyledTableRow key={speciality.id} hover>
                    <TableCell><Typography variant="h6" sx={{ fontWeight: 700 }}>{speciality.id || "-"}</Typography></TableCell>
                    <TableCell><Typography variant="h6" sx={{ fontWeight: 700 }}>{speciality.name ? speciality.name.substring(0, 50).toUpperCase() : "-"}</Typography></TableCell>
                    <TableCell><Typography variant="h6">{speciality.user?.name || "-"}</Typography></TableCell>
                    <TableCell><Typography variant="h6">{speciality.created_at ? format(parseISO(speciality.created_at), "dd/MM/yyyy HH:mm:ss") : "-"}</Typography></TableCell>
                    <TableCell align="center">
                      <Box className="queue-page__actions" sx={{ "& button": { mx: 1 } }}>
                        <Button
                          className="queue-page__action queue-page__action--success"
                          title="Editar especialidade"
                          onClick={() => handleEditSpeciality(speciality)}
                          color="success"
                          size="medium"
                          variant="contained"
                          sx={{ minWidth: 62, height: 40 }}
                          disabled={profile !== "admin" && speciality.id_user !== user}
                        >
                          <FeatherIcon icon="edit" width="20" height="20" />
                        </Button>
                        <Button
                          className="queue-page__action queue-page__action--danger"
                          title="Excluir especialidade"
                          onClick={() => handleInactiveSpeciality(speciality)}
                          color="error"
                          size="medium"
                          variant="contained"
                          sx={{ minWidth: 62, height: 40 }}
                          disabled={profile !== "admin" && speciality.id_user !== user}
                        >
                          <FeatherIcon icon="trash" width="20" height="20" />
                        </Button>
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))}
              {allSpecialities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">Nenhum registro encontrado!</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            className="queue-page__pagination"
            component="div"
            count={allSpecialities.length}
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
