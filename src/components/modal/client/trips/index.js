import React, { useEffect, useState } from "react";
import { Copy, Printer } from "lucide-react";
import { parseISO, format } from "date-fns";

import { api } from "../../../../services/api";
import tripPDF from "../../../../reports/trip";
import ReplicateTripModal from "../../trips/replicate";
import { getRouteDisplayText, getRouteTitleText } from "../../../trips";
import { Button } from "../../../ui/button";
import { Carregando } from "../../../ui/carregando";
import { DataTable } from "../../../ui/data-table";
import { Dialogo, DialogoCabecalho } from "../../../ui/dialogo";

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

  const colunas = [
    { chave: "id", titulo: "ID", numerica: true, render: (trip) => <span className="font-semibold">{trip.id}</span> },
    {
      chave: "motorista",
      titulo: "Motorista / Veículo",
      render: (trip) => {
        const { driver, vehicle } = getDriverVehicleText(trip);
        return (
          <>
            <span className="font-semibold">{driver}</span>
            <span className="block text-xs text-muted-foreground">{vehicle}</span>
          </>
        );
      },
    },
    {
      chave: "rota",
      titulo: "Rota / Horário",
      render: (trip) => (
        <>
          <span className="font-semibold" title={getRouteTitleText(trip?.route)}>{getRouteDisplayText(trip?.route)}</span>
          <span className="block text-xs text-muted-foreground">
            {trip?.departure_date && format(parseISO(trip.departure_date), "dd/MM/yyyy")} {trip?.departure_time}
          </span>
        </>
      ),
    },
    {
      chave: "acoes",
      titulo: "Ações",
      render: (trip) => (
        <div className="flex gap-2">
          <Button variant="success" size="icon-sm" title="Imprimir viagem" aria-label="Imprimir viagem" onClick={() => tripPDF(trip)}>
            <Printer />
          </Button>
          <Button variant="secondary" size="icon-sm" title="Replicar viagem" aria-label="Replicar viagem" onClick={() => setReplicateTrip(trip)}>
            <Copy />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Dialogo aberto aoFechar={onClose} tamanho="lg">
      <DialogoCabecalho>Viagens de {client?.name || `Cliente #${client?.id ?? ""}`}</DialogoCabecalho>

      {loading ? (
        <Carregando>Carregando viagens...</Carregando>
      ) : error ? (
        <p role="alert" className="py-2 text-sm text-danger">{error}</p>
      ) : trips.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">Nenhuma viagem encontrada para este cliente.</p>
      ) : (
        <DataTable rotulo="Viagens do cliente" colunas={colunas} linhas={trips} chaveDaLinha={(trip) => trip.id} />
      )}

      {replicateTrip && (
        <ReplicateTripModal open={!!replicateTrip} trip={replicateTrip} onClose={() => setReplicateTrip(null)} />
      )}
    </Dialogo>
  );
}
