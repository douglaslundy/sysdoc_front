import TripScheduleAgenda from "../../src/components/trips/agenda";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";

const AgendaDeViagens = () => (
    <>
        <CabecalhoDePagina titulo="Agenda de viagens" subtitulo="Agende passageiros e acompanhantes por data e envie para uma viagem." />
        <TripScheduleAgenda />
    </>
);

export default AgendaDeViagens;
