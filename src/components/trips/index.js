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
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Backdrop,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
import { ActionCreateFab, ActionDeleteButton, ActionEditButton } from "../actions";
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";
import TripModal from "../modal/trips";
import TripClientsModal from "../modal/trips/clients";
import tripPDF from "../../reports/trip";
import tripsPDF from "../../reports/trips";
import bpaTripsPdf from "../../reports/bpaTrips";
import printTripsSelectedPDF from "../../reports/printTripsSelected";
import loteTxt from "../../reports/loteTxt";

import { useSelector, useDispatch } from "react-redux";
import { excludeTripFetch, getAllTripsPerDate } from "../../store/fetchActions/trips";
import { showTrip } from "../../store/ducks/trips";
import { changeTitleAlert, openModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";

import AlertModal from "../messagesModal";
import { parseISO, format } from "date-fns";
import BasicDatePicker from "../inputs/datePicker";
import { AuthContext } from "../../contexts/AuthContext";

const StyledTableRow = styled(TableRow)(() => ({
  '& td': {
    background: 'var(--queue-row-bg)',
    borderTop: '0.5px solid var(--lg-border)',
    borderBottom: '0.5px solid var(--lg-border)',
    paddingTop: 12,
    paddingBottom: 12,
    color: 'var(--queue-text-primary)',
  },
  '& td + td': { borderLeft: '0.5px solid rgba(114, 147, 222, 0.24)' },
  '& td:first-of-type': { borderLeft: '0.5px solid var(--lg-border)', borderRadius: '14px 0 0 14px' },
  '& td:last-of-type': { borderRight: '0.5px solid var(--lg-border)', borderRadius: '0 14px 14px 0' },
  '&:hover td': { background: 'var(--queue-row-hover)' },
}));

const BPA_AUTORIZACAO_MAX_LENGTH = 13;
const BPA_CNES_MAX_LENGTH = 7;
const ROUTE_TIME_MAX_LENGTH = 30;

const getRouteDisplayText = (route) => {
  const routeText = [route?.origin, route?.destination]
    .filter(Boolean)
    .map((value) => value.toUpperCase())
    .join(" X ");

  return (routeText || "ROTA NAO ATRIBUIDA").slice(0, ROUTE_TIME_MAX_LENGTH);
};

const getRouteTitleText = (route) => {
  const routeText = [route?.origin, route?.destination]
    .filter(Boolean)
    .map((value) => value.toUpperCase())
    .join(" X ");

  return routeText || "ROTA NAO ATRIBUIDA";
};

const SwitchModal = ({ option }) => {
  switch (option) {
    case "addCli":
      return <TripClientsModal />;
    case "addTrip":
      return <TripModal />;
    default:
      return <></>;
  }
};

export default function Trips() {
  const { profile } = useContext(AuthContext);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "Deseja realmente excluir",
    subTitle: "Esta ação não poderá ser desfeita",
  });

  const dispatch = useDispatch();
  const { trips } = useSelector((state) => state.trips);
  const { isOpenLoading } = useSelector((state) => state.layout);
  const [searchValue, setSearchValue] = useState("");
  const [searchMode, setSearchMode] = useState("include");
  const [allTrips, setAllTrips] = useState(trips);
  const [option, setOption] = useState("add");
  const [dateBegin, setDateBegin] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [printTrips, setPrintTrips] = useState([]);
  const [selectAllTrips, setSelectAllTrips] = useState(false);
  const [bpaModalOpen, setBpaModalOpen] = useState(false);
  const [bpaForm, setBpaForm] = useState({
    cnes: "2794454",
    cnsProfissional: "",
    cbo: "",
    numeroAutorizacao: "",
  });
  const [bpaErrors, setBpaErrors] = useState({});

  useEffect(() => {
    dispatch(getAllTripsPerDate(dateBegin, dateEnd));
  }, [dispatch]);

  useEffect(() => {
    const term = (searchValue ?? "").toLowerCase().trim();
    setAllTrips(
      term
        ? trips.filter((trip) => {
            const motorista = (trip.driver?.name ?? "").toLowerCase();
            const destino = (trip.route?.destination ?? "").toLowerCase();
            const placa = (trip.vehicle?.license_plate ?? "").toLowerCase();
            const matchesSearch = motorista.includes(term) || destino.includes(term) || placa.includes(term);

            return searchMode === "exclude" ? !matchesSearch : matchesSearch;
          })
        : trips
    );
  }, [searchMode, searchValue, trips]);

  const handleInactiveTrip = async (trip) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja realmente excluir a viagem ${trip.id}`,
      confirm: excludeTripFetch(trip),
    });
    dispatch(changeTitleAlert(`A viagem ${trip.id} foi excluída com sucesso!`));
  };

  const getTripsPerDate = () => {
    dispatch(getAllTripsPerDate(dateBegin, dateEnd));
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleGoAddClients = (trip) => {
    setOption("addCli");
    dispatch(showTrip(trip));
    dispatch(openModal());
  };

  const handleGoTrip = (trip) => {
    setOption("addTrip");
    if (trip) {
      dispatch(showTrip(trip));
    }
    dispatch(openModal());
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handlePrintConfirm = (trip) => {
    const alreadySelected = printTrips.find((t) => t.id === trip.id);

    if (alreadySelected) {
      setPrintTrips((prev) => prev.filter((t) => t.id !== trip.id));
    } else {
      setPrintTrips((prev) => [...prev, trip]);
    }
  };

  const handleCheckedAllTrips = (event) => {
    const checked = event.target.checked;
    setSelectAllTrips(checked);

    if (checked) {
      setPrintTrips(allTrips);
    } else {
      setPrintTrips([]);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openBpaModal = () => {
    setBpaErrors({});
    setBpaModalOpen(true);
  };

  const closeBpaModal = () => {
    setBpaModalOpen(false);
    setBpaErrors({});
  };

  const changeBpaForm = ({ target }) => {
    const value = target.name === "numeroAutorizacao"
      ? target.value.toUpperCase().slice(0, BPA_AUTORIZACAO_MAX_LENGTH)
      : target.value.replace(/\D/g, "");
    setBpaForm((prev) => ({ ...prev, [target.name]: value }));
    setBpaErrors((prev) => ({ ...prev, [target.name]: "" }));
  };

  const handleGenerateBpa = () => {
    const errors = {};
    const cnes = bpaForm.cnes.replace(/\D/g, "");
    const cnsProfissional = bpaForm.cnsProfissional.replace(/\D/g, "");
    const cbo = bpaForm.cbo.replace(/\D/g, "");
    const numeroAutorizacao = bpaForm.numeroAutorizacao.toUpperCase().slice(0, BPA_AUTORIZACAO_MAX_LENGTH);

    if (cnes.length !== BPA_CNES_MAX_LENGTH) {
      errors.cnes = "Informe o CNES com 7 digitos.";
    }

    if (cnsProfissional.length !== 15) {
      errors.cnsProfissional = "Informe o CNS com 15 digitos.";
    }

    if (cbo.length !== 6) {
      errors.cbo = "Informe o CBO com 6 digitos.";
    }

    if (Object.keys(errors).length > 0) {
      setBpaErrors(errors);
      return;
    }

    loteTxt(allTrips, { cnes, cnsProfissional, cbo, numeroAutorizacao });
    closeBpaModal();
  };

  const actionFabSx = {
    width: 48,
    height: 48,
    minHeight: 48,
    boxShadow: "var(--lg-shadow-btn)",
  };
  const tripDatePickerSx = {
    flex: "0 0 154px",
    minWidth: 154,
    width: 154,
    maxWidth: 154,
    "& .MuiInputBase-input": {
      fontSize: "0.85rem",
    },
    "& .MuiInputLabel-root": {
      fontSize: "0.85rem",
    },
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page">
    <BaseCard title={`Você possui ${allTrips.length} Viagens Cadastradas`}>
      <Backdrop
        open={isOpenLoading && allTrips.length === 0}
        sx={{
          position: 'absolute',
          zIndex: 20,
          color: '#fff',
          background: 'rgba(0, 0, 0, 0.45)',
          borderRadius: '8px',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <CircularProgress color="inherit" size={34} />
        <Typography variant="body2" sx={{ color: 'var(--lg-text-primary)' }}>
          Carregando viagens...
        </Typography>
      </Backdrop>
      <AlertModal />
      <Stack className="queue-page__toolbar" sx={{ gap: 1.5, mb: 2 }}>
        <SwitchModal option={option} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, width: '100%' }}>

          {/* Filtros: todos inline na mesma linha */}
          <Box sx={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 1.5, flex: '1 1 0%', minWidth: 0, width: '100%', justifyContent: 'flex-start' }}>
            <TextField
              className="lg-search-field trips-search-field"
              placeholder="Buscar por motorista, destino ou placa"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              size="small"
              sx={{ flex: '1 1 0%', minWidth: 0, width: '100%' }}
            />

            <FormControlLabel
              sx={{ flexShrink: 0, whiteSpace: "nowrap", m: 0 }}
              control={
                <Switch
                  checked={searchMode === "exclude"}
                  onChange={(e) => setSearchMode(e.target.checked ? "exclude" : "include")}
                />
              }
              label={searchMode === "exclude" ? "Excluir" : "Incluir"}
            />

            <BasicDatePicker
              label="Data de Início"
              name="date_begin"
              value={dateBegin}
              setValue={setDateBegin}
              className="lg-search-field trips-date-field"
              sx={tripDatePickerSx}
            />

            <BasicDatePicker
              label="Data de Fim"
              name="date_end"
              value={dateEnd}
              disabled={!dateBegin}
              setValue={setDateEnd}
              className="lg-search-field trips-date-field"
              sx={tripDatePickerSx}
            />

            <Button
              title="Buscar"
              onClick={getTripsPerDate}
              disabled={!dateBegin}
              color="primary"
              variant="contained"
              sx={{ minWidth: 48, height: 48, minHeight: 48, px: 1.2, flexShrink: 0 }}
            >
              <FeatherIcon icon="search" width="16" height="16" />
            </Button>
          </Box>

          {/* Botões de ação */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {profile === "admin" && (
              <>
              <Fab
                  title="Imprimir PDF com BPA-I"
                  onClick={() => { bpaTripsPdf(allTrips); }}
                  color="success"
                  aria-label="imprimir-bpa"
                  disabled={allTrips.length <= 0}
                  sx={actionFabSx}
                >
                  <FeatherIcon icon="file" width="16" height="16" />
                </Fab>
                <Fab
                  title="Gerar BPA-I"
                  onClick={() => { openBpaModal(); }}
                  color="success"
                  aria-label="gerar-bpa"
                  disabled={allTrips.length <= 0}
                  sx={actionFabSx}
                >
                  <FeatherIcon icon="download" width="16" height="16" />
                </Fab>
              </>
            )}

              <Fab
                title="Imprimir mapa de viagens"
                onClick={() => { tripsPDF(allTrips); }}
                color="success"
                aria-label="imprimir-mapa"
                disabled={allTrips.length <= 0}
                sx={actionFabSx}
              >
              <FeatherIcon icon="printer" width="16" height="16" />
            </Fab>

            <ActionCreateFab
              title="Cadastrar viagem"
              onClick={() => { handleGoTrip(); }}
              icon="user-plus"
              sx={{ ...actionFabSx, boxShadow: "0 0 20px rgba(124,58,237,0.45)" }}
            />
          </Box>

        </Box>
      </Stack>

      {trips?.length > 0 && (
        <>
          <FormControlLabel
            control={<Switch checked={selectAllTrips} onChange={handleCheckedAllTrips} />}
            label={selectAllTrips ? "Desmarcar todas as viagens" : "Marcar todas as viagens para impressão"}
          />

          {printTrips?.length > 0 && (
            <Fab
              title="Imprimir mapa de viagens"
              onClick={() => {
                printTripsSelectedPDF(printTrips);
              }}
              color="primary"
              aria-label="imprimir-selecionadas"
              disabled={allTrips.length <= 0}
              sx={actionFabSx}
            >
              <FeatherIcon icon="printer" width="16" height="16" />
            </Fab>
          )}
        </>
      )}

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
              <TableCell className="queue-page__th" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                <Typography color="textSecondary" variant="h6">
                  IMPRIMIR
                </Typography>
              </TableCell>
              <TableCell className="queue-page__th">
                <Typography color="textSecondary" variant="h6">
                  ID
                </Typography>
              </TableCell>
              <TableCell className="queue-page__th">
                <Typography color="textSecondary" variant="h6">
                  MOTORISTA / VEÍCULO
                </Typography>
              </TableCell>
              <TableCell className="queue-page__th">
                <Typography color="textSecondary" variant="h6">
                  ROTA / HORÁRIO
                </Typography>
              </TableCell>
              <TableCell className="queue-page__th">
                <Typography color="textSecondary" variant="h6">
                  LOTAÇÃO
                </Typography>
              </TableCell>
              <TableCell className="queue-page__th" align="center">
                <Typography color="textSecondary" variant="h6">
                  Ações
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {allTrips
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((trip) => (
                <StyledTableRow key={`${trip?.id}-${selectAllTrips}`} hover>
                  <TableCell sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                    <FormControlLabel
                      sx={{ m: 0, whiteSpace: 'nowrap' }}
                      control={
                        <Switch
                          checked={!!printTrips.find((t) => t.id === trip.id)}
                          onChange={() => handlePrintConfirm(trip)}
                        />
                      }
                      label={!printTrips.find((t) => t.id === trip.id) ? "NÃO" : "SIM"}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "600",
                        fontSize: "17px",
                      }}
                    >
                      {trip?.id}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: "600", fontSize: "15px" }}>
                          {trip?.driver ? trip.driver.name.toUpperCase() : "MOTORISTA NÃO ATRIBUÍDO"}
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: "11px" }}>
                          {trip?.vehicle
                            ? `${trip.vehicle.brand.toUpperCase()} ${trip.vehicle.model.toUpperCase()} ${trip.vehicle.license_plate.toUpperCase()} - ${trip.vehicle.capacity} LUGARES`
                            : "VEÍCULO NÃO ATRIBUÍDO"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "600",
                        fontSize: "15px",
                      }}
                      title={getRouteTitleText(trip?.route)}
                    >
                      {getRouteDisplayText(trip?.route)}
                    </Typography>

                    <Typography variant="h6" sx={{ fontSize: "11px" }}>
                      {trip?.departure_date && format(parseISO(trip?.departure_date), "dd/MM/yyyy")} {trip?.departure_time}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Button
                      title="Passageiros incluindo acompanhantes"
                      onClick={() => {
                        handleGoAddClients(trip);
                      }}
                      color="primary"
                      size="medium"
                      variant="contained"
                      sx={{ minHeight: 36, whiteSpace: "nowrap" }}
                    >
                      <FeatherIcon icon="users" width="16" height="16" />
                      <Box sx={{ ml: 0.8 }}>{trip?.clients?.length}</Box>
                    </Button>
                  </TableCell>

                  <TableCell align="center" sx={{ minWidth: 210 }}>
                    <Box sx={{ display: "inline-flex", flexWrap: "nowrap", "& button": { mx: 0.5 } }}>
                      <Button
                        title="Imprimir Viagem"
                        onClick={() => {
                          tripPDF(trip);
                        }}
                        color="success"
                        size="medium"
                        variant="contained"
                      >
                        <FeatherIcon icon="printer" width="20" height="20" />
                      </Button>

                      <ActionEditButton
                        title="Editar Viagem"
                        onClick={() => {
                          handleGoTrip(trip);
                        }}
                      />

                      <ActionDeleteButton
                        title="Excluir Viagem"
                        onClick={() => {
                          handleInactiveTrip(trip);
                        }}
                      />
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination className="queue-page__pagination"
          component="div"
          count={allTrips.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />

      <Dialog
        className="queue-page__dialog"
        open={bpaModalOpen}
        onClose={closeBpaModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            width: "min(440px, 96vw) !important",
          },
        }}
      >
        <DialogTitle>Gerar BPA-I</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, pt: 1 }}>
            <TextField
              label="CNES"
              name="cnes"
              value={bpaForm.cnes}
              onChange={changeBpaForm}
              inputProps={{ maxLength: BPA_CNES_MAX_LENGTH, inputMode: "numeric" }}
              error={!!bpaErrors.cnes}
              helperText={bpaErrors.cnes || "Obrigatorio para gerar o arquivo."}
              fullWidth
            />

            <TextField
              label="CNS do medico"
              name="cnsProfissional"
              value={bpaForm.cnsProfissional}
              onChange={changeBpaForm}
              inputProps={{ maxLength: 15, inputMode: "numeric" }}
              error={!!bpaErrors.cnsProfissional}
              helperText={bpaErrors.cnsProfissional || "Obrigatorio para gerar o arquivo."}
              fullWidth
            />

            <TextField
              label="CBO"
              name="cbo"
              value={bpaForm.cbo}
              onChange={changeBpaForm}
              inputProps={{ maxLength: 6, inputMode: "numeric" }}
              error={!!bpaErrors.cbo}
              helperText={bpaErrors.cbo || "Obrigatorio para gerar o arquivo."}
              fullWidth
            />

            <TextField
              label="Numero de autorizacao"
              name="numeroAutorizacao"
              value={bpaForm.numeroAutorizacao}
              onChange={changeBpaForm}
              inputProps={{ maxLength: BPA_AUTORIZACAO_MAX_LENGTH }}
              helperText={`Opcional no BPA-I. Maximo de ${BPA_AUTORIZACAO_MAX_LENGTH} caracteres.`}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBpaModal} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleGenerateBpa} variant="contained" color="success">
            Gerar arquivo
          </Button>
        </DialogActions>
      </Dialog>
    </BaseCard>
    </Box>
  );
}


