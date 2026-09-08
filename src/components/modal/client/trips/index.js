import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  styled,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
import { parseISO, format } from "date-fns";

import { api } from "../../../../services/api";
import tripPDF from "../../../../reports/trip";
import ReplicateTripModal from "../../trips/replicate";
import { getRouteDisplayText, getRouteTitleText } from "../../../trips";

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
}));

const getDriverVehicleText = (trip) => ({
  driver: trip?.driver ? trip.driver.name.toUpperCase() : "MOTORISTA NÃO ATRIBUÍDO",
  vehicle: trip?.vehicle
    ? `${trip.vehicle.brand.toUpperCase()} ${trip.vehicle.model.toUpperCase()} ${trip.vehicle.license_plate.toUpperCase()} - ${trip.vehicle.capacity} LUGARES`
    : "VEÍCULO NÃO ATRIBUÍDO",
});

// Busca só as viagens deste cliente via ?client_id no backend (filtro por
// whereHas na relação trip_clients) — evita trazer a tabela inteira de
// viagens do sistema para filtrar no navegador a cada abertura do modal.
export default function ClientTripsModal({ client, onClose }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replicateTrip, setReplicateTrip] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!client?.id) {
      setTrips([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError("");

    api
      .get("/trips", { params: { client_id: client.id } })
      .then(({ data }) => {
        if (cancelled) return;
        const clientTrips = (Array.isArray(data) ? data : [])
          .sort((a, b) => new Date(b?.departure_date || 0) - new Date(a?.departure_date || 0));
        setTrips(clientTrips);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || "Não foi possível carregar as viagens do cliente.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client?.id]);

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth className="client-trips-modal">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Viagens de {client?.name || `Cliente #${client?.id ?? ""}`}
        </Typography>
        <IconButton onClick={onClose} aria-label="Fechar">
          <FeatherIcon icon="x" width={20} height={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="textSecondary">
              Carregando viagens...
            </Typography>
          </Box>
        ) : error ? (
          <Typography sx={{ py: 2, color: "error.main" }}>{error}</Typography>
        ) : trips.length === 0 ? (
          <Typography sx={{ py: 2 }} color="textSecondary">
            Nenhuma viagem encontrada para este cliente.
          </Typography>
        ) : (
          <TableContainer>
            <Table
              aria-label="viagens do cliente"
              sx={{ mt: 1, whiteSpace: "nowrap", borderCollapse: "separate", borderSpacing: "0 10px" }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography color="textSecondary" variant="h6">ID</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="textSecondary" variant="h6">MOTORISTA / VEÍCULO</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="textSecondary" variant="h6">ROTA / HORÁRIO</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography color="textSecondary" variant="h6">Ações</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trips.map((trip) => {
                  const { driver, vehicle } = getDriverVehicleText(trip);
                  return (
                    <StyledTableRow key={trip.id} hover>
                      <TableCell>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "17px" }}>
                          {trip.id}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "15px" }}>
                          {driver}
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: "11px" }}>
                          {vehicle}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, fontSize: "15px" }}
                          title={getRouteTitleText(trip?.route)}
                        >
                          {getRouteDisplayText(trip?.route)}
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: "11px" }}>
                          {trip?.departure_date && format(parseISO(trip.departure_date), "dd/MM/yyyy")} {trip?.departure_time}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: "inline-flex", flexWrap: "nowrap", "& button": { mx: 0.5 } }}>
                          <Button
                            title="Imprimir viagem"
                            onClick={() => tripPDF(trip)}
                            color="success"
                            size="medium"
                            variant="contained"
                          >
                            <FeatherIcon icon="printer" width="18" height="18" />
                          </Button>

                          <Button
                            title="Replicar viagem"
                            onClick={() => setReplicateTrip(trip)}
                            color="info"
                            size="medium"
                            variant="contained"
                          >
                            <FeatherIcon icon="copy" width="18" height="18" />
                          </Button>
                        </Box>
                      </TableCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      {replicateTrip && (
        <ReplicateTripModal
          open={!!replicateTrip}
          trip={replicateTrip}
          onClose={() => setReplicateTrip(null)}
        />
      )}
    </Dialog>
  );
}
