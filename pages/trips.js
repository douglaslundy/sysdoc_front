import { useState } from "react";
import Trips from "../src/components/trips";
import TripScheduleAgenda from "../src/components/trips/agenda";
import { Button } from "../src/components/ui/button";
import { CabecalhoDePagina } from "../src/components/ui/cabecalho-de-pagina";

const Tables = () => {
    const [aba, setAba] = useState("viagens");

    return (
        <>
            <div className="mb-4 inline-flex rounded-lg border border-border p-0.5" role="tablist" aria-label="Viagens">
                <Button type="button" role="tab" aria-selected={aba === "viagens"} size="sm" variant={aba === "viagens" ? "default" : "ghost"} onClick={() => setAba("viagens")}>Viagens</Button>
                <Button type="button" role="tab" aria-selected={aba === "agenda"} size="sm" variant={aba === "agenda" ? "default" : "ghost"} onClick={() => setAba("agenda")}>Agenda de viagens</Button>
            </div>
            {aba === "viagens" ? (
                <Trips />
            ) : (
                <>
                    <CabecalhoDePagina titulo="Agenda de viagens" subtitulo="Agende passageiros e acompanhantes por data e envie para uma viagem." />
                    <TripScheduleAgenda />
                </>
            )}
        </>
    );
};

export default Tables;
