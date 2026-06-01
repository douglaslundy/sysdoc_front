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
    backgroundColor: 'rgba(15, 28, 60, 0.55)',
    borderTop: '1px solid rgba(86,127,201,0.22)',
    borderBottom: '1px solid rgba(86,127,201,0.22)',
    paddingTop: '16px',
    paddingBottom: '16px',
  },
  '& td:first-of-type': { borderLeft: '1px solid rgba(86,127,201,0.22)', borderRadius: '14px 0 0 14px' },
  '& td:last-of-type': { borderRight: '1px solid rgba(86,127,201,0.22)', borderRadius: '0 14px 14px 0' },
}));

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
  const [allTrips, setAllTrips] = useState(trips);
  const [option, setOption] = useState("add");
  const [dateBegin, setDateBegin] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [printTrips, setPrintTrips] = useState([]);
  const [selectAllTrips, setSelectAllTrips] = useState(false);
  const [bpaModalOpen, setBpaModalOpen] = useState(false);
  const [bpaForm, setBpaForm] = useState({
    cnsProfissional: "",
    cbo: "",
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
            return motorista.includes(term) || destino.includes(term) || placa.includes(term);
          })
        : trips
    );
  }, [searchValue, trips]);

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
    const value = target.value.replace(/\D/g, "");
    setBpaForm((prev) => ({ ...prev, [target.name]: value }));
    setBpaErrors((prev) => ({ ...prev, [target.name]: "" }));
  };

  const handleGenerateBpa = () => {
    const errors = {};
    const cnsProfissional = bpaForm.cnsProfissional.replace(/\D/g, "");
    const cbo = bpaForm.cbo.replace(/\D/g, "");

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

    loteTxt(allTrips, { cnsProfissional, cbo });
    closeBpaModal();
  };

  const actionFabSx = {
    width: 40,
    height: 40,
    minHeight: 40,
    boxShadow: "var(--lg-shadow-btn)",
  };

  return (
    <Box sx={modalFormRootSx}>
    <BaseCard title={`Você possui ${allTrips.length} Viagens Cadastradas`}>
      <Backdrop
        open={isOpenLoading}
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
      <Stack sx={{ gap: 1.5, mb: 2 }}>
        <SwitchModal option={option} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>

          {/* Filtros: todos inline na mesma linha */}
          <Box sx={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
            <TextField
              className="lg-search-field"
              placeholder="Buscar por motorista, destino ou placa"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 180 }}
            />

            <BasicDatePicker
              label="Data de Início"
              name="date_begin"
              value={dateBegin}
              setValue={setDateBegin}
              sx={{ minWidth: 170, width: 170 }}
            />

            <BasicDatePicker
              label="Data de Fim"
              name="date_end"
              value={dateEnd}
              disabled={!dateBegin}
              setValue={setDateEnd}
              sx={{ minWidth: 170, width: 170 }}
            />

            <Button
              title="Buscar"
              onClick={getTripsPerDate}
              disabled={!dateBegin}
              color="primary"
              variant="contained"
              sx={{ minWidth: 44, height: 40, px: 1.2, flexShrink: 0 }}
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
                sx={{ ...actionFabSx, width: 44, height: 44 }}
              >
              <FeatherIcon icon="printer" width="16" height="16" />
            </Fab>

            <ActionCreateFab
              title="Cadastrar viagem"
              onClick={() => { handleGoTrip(); }}
              icon="user-plus"
              sx={{ ...actionFabSx, width: 56, height: 56, boxShadow: "0 0 20px rgba(124,58,237,0.45)" }}
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
                  IMPRIMIR
                </Typography>
              </TableCell>
              <TableCell>
                <Typography color="textSecondary" variant="h6">
                  ID
                </Typography>
              </TableCell>
              <TableCell>
                <Typography color="textSecondary" variant="h6">
                  MOTORISTA / VEÃCULO
                </Typography>
              </TableCell>
              <TableCell>
                <Typography color="textSecondary" variant="h6">
                  ROTA / HORÃRIO
                </Typography>
              </TableCell>
              <TableCell>
                <Typography color="textSecondary" variant="h6">
                  LOTAÇÃO
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
            {allTrips
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((trip) => (
                <StyledTableRow key={`${trip?.id}-${selectAllTrips}`} hover>
                  <TableCell>
                    <FormControlLabel
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
                          {trip?.driver ? trip.driver.name.toUpperCase() : "MOTORISTA NÃO ATRIBUÃDO"}
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: "11px" }}>
                          {trip?.vehicle
                            ? `${trip.vehicle.brand.toUpperCase()} ${trip.vehicle.model.toUpperCase()} ${trip.vehicle.license_plate.toUpperCase()} - ${trip.vehicle.capacity} LUGARES`
                            : "VEÃCULO NÃO ATRIBUÃDO"}
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
                    >
                      {trip?.route?.origin.toUpperCase()} X {trip?.route?.destination.toUpperCase()}
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
        <TablePagination
          component="div"
          count={allTrips.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />

      <Dialog open={bpaModalOpen} onClose={closeBpaModal} maxWidth="xs" fullWidth>
        <DialogTitle>Gerar BPA-I</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, pt: 1 }}>
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


