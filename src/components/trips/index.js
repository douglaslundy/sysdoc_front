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
} from "@mui/material";

import { useTheme } from "@mui/material/styles";
import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
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
import { changeTitleAlert, turnModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";

import AlertModal from "../messagesModal";
import { parseISO, format } from "date-fns";
import BasicDatePicker from "../inputs/datePicker";
import { AuthContext } from "../../contexts/AuthContext";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

export default function Trips() {
  const theme = useTheme();
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
    dispatch(turnModal());
  };

  const handleGoTrip = (trip) => {
    setOption("addTrip");
    if (trip) {
      dispatch(showTrip(trip));
    }
    dispatch(turnModal());
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

  const getColorByStatus = (isOk) =>
    isOk ? theme.palette.primary.main : theme.palette.text.primary;

  const actionFabSx = {
    width: 40,
    height: 40,
    minHeight: 40,
    boxShadow: "var(--lg-shadow-btn)",
  };

  return (
    <BaseCard title={`Você possui ${allTrips.length} Viagens Cadastradas`}>
      <Backdrop
        open={isOpenLoading}
        sx={{
          position: 'absolute',
          zIndex: 20,
          color: '#fff',
          background: 'var(--lg-overlay-bg)',
          backdropFilter: 'var(--lg-blur-overlay)',
          WebkitBackdropFilter: 'var(--lg-blur-overlay)',
          borderRadius: '16px',
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

        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{ gap: 1.5, alignItems: { xs: "stretch", md: "center" }, flexWrap: "wrap" }}
        >
          <BasicDatePicker
            label="Data de Início"
            name="date_begin"
            value={dateBegin}
            setValue={setDateBegin}
            sx={{ minWidth: 190, width: { xs: "100%", md: 190 } }}
          />

          <BasicDatePicker
            label="Data de Fim"
            name="date_end"
            value={dateEnd}
            disabled={!dateBegin}
            setValue={setDateEnd}
            sx={{ minWidth: 190, width: { xs: "100%", md: 190 } }}
          />

          <Button
            title="Buscar"
            onClick={getTripsPerDate}
            disabled={!dateBegin}
            color="success"
            variant="contained"
            sx={{ minWidth: 44, height: 40, px: 1.2 }}
          >
            <FeatherIcon icon="search" width="16" height="16" />
          </Button>

          <TextField
            className="lg-search-field"
            placeholder="Buscar por motorista, destino ou placa"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            size="small"
            sx={{ minWidth: { xs: "100%", md: 320 }, flexGrow: 1 }}
          />

          {profile === "admin" && (
            <>
              <Fab
                title="Imprimir PDF com BPA-I"
                onClick={() => {
                  bpaTripsPdf(allTrips);
                }}
                color="success"
                aria-label="imprimir-bpa"
                disabled={allTrips.length <= 0}
                sx={actionFabSx}
              >
                <FeatherIcon icon="file" width="16" height="16" />
              </Fab>
              <Fab
                title="Gerar BPA-I"
                onClick={() => {
                  loteTxt(allTrips);
                }}
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
            onClick={() => {
              tripsPDF(allTrips);
            }}
            color="success"
            aria-label="imprimir-mapa"
            disabled={allTrips.length <= 0}
            sx={actionFabSx}
          >
            <FeatherIcon icon="printer" width="16" height="16" />
          </Fab>

          <Fab
            title="Cadastrar viagem"
            onClick={() => {
              handleGoTrip();
            }}
            color="primary"
            aria-label="cadastrar-viagem"
            sx={actionFabSx}
          >
            <FeatherIcon icon="user-plus" width="16" height="16" />
          </Fab>
        </Stack>
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
                  MOTORISTA / VEÍCULO
                </Typography>
              </TableCell>
              <TableCell>
                <Typography color="textSecondary" variant="h6">
                  ROTA / HORÁRIO
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
                        fontSize: "20px",
                        color: getColorByStatus(trip?.is_ok),
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
                        color: getColorByStatus(trip?.is_ok),
                      }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: "600", fontSize: "18px" }}>
                          {trip?.driver ? trip.driver.name.toUpperCase() : "MOTORISTA NÃO ATRIBUÍDO"}
                        </Typography>
                        <Typography variant="h6">
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
                        fontSize: "18px",
                        color: getColorByStatus(trip?.is_ok),
                      }}
                    >
                      {trip?.route?.origin.toUpperCase()} X {trip?.route?.destination.toUpperCase()}
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        color: getColorByStatus(trip?.is_ok),
                      }}
                    >
                      {trip?.departure_date && format(parseISO(trip?.departure_date), "dd/MM/yyyy")} {trip?.departure_time}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Button
                      title="Passageiros incluindo acompanhantes"
                      onClick={() => {
                        handleGoAddClients(trip);
                      }}
                      color="success"
                      size="medium"
                      variant="contained"
                      sx={{ minHeight: 36 }}
                    >
                      <FeatherIcon icon="users" width="16" height="16" />
                      <Box sx={{ ml: 0.8 }}>{trip?.clients?.length}</Box>
                    </Button>
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ "& button": { mx: 0.5, minWidth: 36, minHeight: 36 } }}>
                      <Button
                        title="Imprimir Viagem"
                        onClick={() => {
                          tripPDF(trip);
                        }}
                        color="success"
                        size="medium"
                        variant="contained"
                      >
                        <FeatherIcon icon="printer" width="16" height="16" />
                      </Button>

                      <Button
                        title="Editar Viagem"
                        onClick={() => {
                          handleGoTrip(trip);
                        }}
                        color="primary"
                        size="medium"
                        variant="contained"
                      >
                        <FeatherIcon icon="edit" width="16" height="16" />
                      </Button>

                      <Button
                        title="Excluir Viagem"
                        onClick={() => {
                          handleInactiveTrip(trip);
                        }}
                        color="error"
                        size="medium"
                        variant="contained"
                      >
                        <FeatherIcon icon="trash" width="16" height="16" />
                      </Button>
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
    </BaseCard>
  );
}
