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
} from "@mui/material";

import { useTheme } from "@mui/material/styles"; // ⬅️ Importa o tema
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
import {
  excludeTripFetch,
  getAllTrips,
  getAllTripsPerDate,
} from "../../store/fetchActions/trips";
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

export default () => {
  const theme = useTheme(); // ⬅️ Hook do tema
  const { user, profile } = useContext(AuthContext);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "Deseja realmente excluir",
    subTitle: "Esta ação não poderá ser desfeita",
  });

  const dispatch = useDispatch();
  const { trips } = useSelector((state) => state.trips);
  const [searchValue, setSearchValue] = useState();
  const [allTrips, setAllTrips] = useState(trips);
  const [option, setOption] = useState("add");
  const [dateBegin, setDateBegin] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [printTrips, setPrintTrips] = useState([]);
  const [selectAllTrips, setSelectAllTrips] = useState(false);

  useEffect(() => {
    dispatch(getAllTripsPerDate(dateBegin, dateEnd));
  }, []);

  useEffect(() => {
    setAllTrips(
      searchValue
        ? [
            ...trips.filter((trip) =>
              trip.license_plate.toString().includes(searchValue.toString())
            ),
          ]
        : trips
    );
  }, [trips]);

  const HandleInactiveTrip = async (trip) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja Realmente Excluir a viagem ${trip.id}`,
      confirm: excludeTripFetch(trip),
    });
    dispatch(changeTitleAlert(`A viagem ${trip.id}  foi excluida com sucesso!`));
  };

  const getTripsPerDate = () => {
    dispatch(getAllTripsPerDate(dateBegin, dateEnd));
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const HandleGoAddClients = (trip) => {
    setOption("addCli");
    dispatch(showTrip(trip));
    dispatch(turnModal());
  };

  const HandleGoTrip = (trip) => {
    setOption("addTrip");
    dispatch(showTrip(trip));
    dispatch(turnModal());
  };

  const handleChangePage = (event, newPage) => {
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

  return (
    <BaseCard title={`Você possui ${allTrips.length} Viagens Cadastrados`}>
      <AlertModal />
      <Box
        sx={{
          "& > :not(style)": { m: 2 },
          display: "flex",
          justifyContent: "stretch",
        }}
      >
        <SwitchModal option={option} />

        <BasicDatePicker
          sx={{ mr: 2 }}
          label="Data de Início"
          name="date_begin"
          value={dateBegin}
          setValue={setDateBegin}
        />

        <BasicDatePicker
          sx={{ mr: 2 }}
          label="Data de Fim"
          name="date_end"
          value={dateEnd}
          disabled={!dateBegin}
          setValue={setDateEnd}
        />

        <Button
          title="Buscar"
          onClick={getTripsPerDate}
          disabled={!dateBegin}
          color="success"
          size="medium"
          variant="contained"
        >
          <FeatherIcon icon="search" width="45" height="45" />
        </Button>

        {profile === "admin" && (
          <>
            <Fab
              title="Imprimir PDF COM BPA-I"
              onClick={() => {
                bpaTripsPdf(allTrips);
              }}
              color="success"
              aria-label="add"
              disabled={allTrips.length <= 0}
            >
              <FeatherIcon icon="file" />
            </Fab>
            <Fab
              title="Gerar BPA-I"
              onClick={() => {
                loteTxt(allTrips);
              }}
              color="success"
              aria-label="add"
              disabled={allTrips.length <= 0}
            >
              <FeatherIcon icon="file-text" />
            </Fab>
          </>
        )}

        <Fab
          title="Imprimir Mapa de viagens"
          onClick={() => {
            tripsPDF(allTrips);
          }}
          color="success"
          aria-label="add"
          disabled={allTrips.length <= 0}
        >
          <FeatherIcon icon="printer" />
        </Fab>

        <Fab
          title="Cadastrar Viagem"
          onClick={() => {
            HandleGoTrip();
          }}
          color="primary"
          aria-label="add"
        >
          <FeatherIcon icon="user-plus" />
        </Fab>
      </Box>

      {trips?.length > 0 && (
        <>
          <FormControlLabel
            control={
              <Switch
                checked={selectAllTrips}
                onChange={handleCheckedAllTrips}
              />
            }
            label={
              selectAllTrips
                ? "Desmarcar todas as viagens!"
                : "Marcar todas as viagens para impressão!"
            }
          />

          {printTrips?.length > 0 && (
            <Fab
              title="Imprimir Mapa de viagens"
              onClick={() => {
                printTripsSelectedPDF(printTrips);
              }}
              color="primary"
              aria-label="add"
              disabled={allTrips.length <= 0}
            >
              <FeatherIcon icon="printer" />
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
              .map((trip, index) => (
                <StyledTableRow
                  key={`${trip?.id}-${selectAllTrips}`}
                  hover
                >
                  <>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!printTrips.find((t) => t.id == trip.id)}
                            onChange={() => handlePrintConfirm(trip)}
                          />
                        }
                        label={
                          !printTrips.find((t) => t.id === trip.id)
                            ? "NÃO"
                            : "SIM"
                        }
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
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "600", fontSize: "18px" }}
                          >
                            {trip?.driver
                              ? trip.driver.name.toUpperCase()
                              : "MOTORISTA NÃO ATRIBUIDO"}
                          </Typography>
                          <Typography variant="h6">
                            {trip?.vehicle
                              ? `${trip.vehicle.brand.toUpperCase()} ${trip.vehicle.model.toUpperCase()} ${trip.vehicle.license_plate.toUpperCase()} - ${trip.vehicle.capacity} LUGARES `
                              : "VEÍCULO NÃO ATRIBUIDO"}
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
                        {trip?.route?.origin.toUpperCase()} X{" "}
                        {trip?.route?.destination.toUpperCase()}
                      </Typography>

                      <Typography
                        variant="h6"
                        sx={{
                          color: getColorByStatus(trip?.is_ok),
                        }}
                      >
                        {trip?.departure_date &&
                          format(
                            parseISO(trip?.departure_date),
                            "dd/MM/yyyy"
                          )}{" "}
                        {trip?.departure_time}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Button
                        title="Passageiros incluindo acompanhantes"
                        onClick={() => {
                          HandleGoAddClients(trip);
                        }}
                        color="success"
                        size="medium"
                        variant="contained"
                      >
                        <FeatherIcon icon="users" width="20" height="20" />
                        <div style={{ marginLeft: "5px" }}>
                          {trip?.clients?.length}
                        </div>
                      </Button>
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ "& button": { mx: 1 } }}>
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

                        <Button
                          title="Editar Viagem"
                          onClick={() => {
                            HandleGoTrip(trip);
                          }}
                          color="primary"
                          size="medium"
                          variant="contained"
                        >
                          <FeatherIcon icon="edit" width="20" height="20" />
                        </Button>

                        <Button
                          title="Excluir Viagem"
                          onClick={() => {
                            HandleInactiveTrip(trip);
                          }}
                          color="error"
                          size="medium"
                          variant="contained"
                        >
                          <FeatherIcon icon="trash" width="20" height="20" />
                        </Button>
                      </Box>
                    </TableCell>
                  </>
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

      <ConfirmDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
      />
    </BaseCard>
  );
};
