import React, { useState, useEffect, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { parseISO, format } from "date-fns";
import { Copy, Download, File, Printer, Search, Users } from "lucide-react";
import { ActionCreateFab, ActionDeleteButton, ActionEditButton, ActionViewButton } from "../actions";
import TripModal from "../modal/trips";
import TripClientsModal from "../modal/trips/clients";
import ReplicateTripModal from "../modal/trips/replicate";
import tripPDF from "../../reports/trip";
import tripsPDF from "../../reports/trips";
import bpaTripsPdf from "../../reports/bpaTrips";
import printTripsSelectedPDF from "../../reports/printTripsSelected";
import loteTxt from "../../reports/loteTxt";
import { excludeTripFetch, getAllTripsPerDate } from "../../store/fetchActions/trips";
import { showTrip } from "../../store/ducks/trips";
import { changeTitleAlert, openTripModal, openTripClientsModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import BasicDatePicker from "../inputs/datePicker";
import { AuthContext } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { CampoDeBusca } from "../ui/campo-de-busca";
import { CampoTexto } from "../ui/campos";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../ui/dialogo";
import { Interruptor } from "../ui/interruptor";
import { PaginaDeLista } from "../ui/pagina-de-lista";
import { usePaginacaoLocal } from "../../lib/usePaginacaoLocal";

const BPA_AUTORIZACAO_MAX_LENGTH = 13;
const BPA_CNES_MAX_LENGTH = 7;
const ROUTE_TIME_MAX_LENGTH = 30;

export const getRouteDisplayText = (route) => {
  const routeText = [route?.origin, route?.destination]
    .filter(Boolean)
    .map((value) => value.toUpperCase())
    .join(" X ");

  return (routeText || "ROTA NÃO ATRIBUÍDA").slice(0, ROUTE_TIME_MAX_LENGTH);
};

export const getRouteTitleText = (route) => {
  const routeText = [route?.origin, route?.destination]
    .filter(Boolean)
    .map((value) => value.toUpperCase())
    .join(" X ");

  return routeText || "ROTA NÃO ATRIBUÍDA";
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
  const [replicateTrip, setReplicateTrip] = useState(null);

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

  const { fatia, propsDaPaginacao } = usePaginacaoLocal(allTrips);

  const handleGoAddClients = (trip) => {
    setOption("addCli");
    dispatch(showTrip(trip));
    dispatch(openTripClientsModal());
  };

  const handleGoTrip = (trip) => {
    setOption("addTrip");
    if (trip) {
      dispatch(showTrip(trip));
    }
    dispatch(openTripModal());
  };

  const handlePrintConfirm = (trip) => {
    const alreadySelected = printTrips.find((t) => t.id === trip.id);

    if (alreadySelected) {
      setPrintTrips((prev) => prev.filter((t) => t.id !== trip.id));
    } else {
      setPrintTrips((prev) => [...prev, trip]);
    }
  };

  const handleCheckedAllTrips = (checked) => {
    setSelectAllTrips(checked);
    setPrintTrips(checked ? allTrips : []);
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

  const colunas = [
    {
      chave: 'imprimir',
      titulo: 'Imprimir',
      render: (trip) => {
        const marcada = Boolean(printTrips.find((t) => t.id === trip.id));
        return (
          <Interruptor id={`imprimir-viagem-${trip.id}`} marcado={marcada} aoMudar={() => handlePrintConfirm(trip)}>
            <span className="text-xs font-bold">{marcada ? "SIM" : "NÃO"}</span>
          </Interruptor>
        );
      },
    },
    {
      chave: 'id',
      titulo: 'ID',
      render: (trip) => <span className="font-semibold">{trip?.id}</span>,
    },
    {
      chave: 'motorista',
      titulo: 'Motorista / Veículo',
      render: (trip) => (
        <>
          <span className="block font-semibold">{trip?.driver ? trip.driver.name.toUpperCase() : "MOTORISTA NÃO ATRIBUÍDO"}</span>
          <span className="block text-xs text-muted-foreground">
            {trip?.vehicle
              ? `${trip.vehicle.brand.toUpperCase()} ${trip.vehicle.model.toUpperCase()} ${trip.vehicle.license_plate.toUpperCase()} - ${trip.vehicle.capacity} LUGARES`
              : "VEÍCULO NÃO ATRIBUÍDO"}
          </span>
        </>
      ),
    },
    {
      chave: 'rota',
      titulo: 'Rota / Horário',
      render: (trip) => (
        <>
          <span className="block font-semibold" title={getRouteTitleText(trip?.route)}>{getRouteDisplayText(trip?.route)}</span>
          <span className="block text-xs text-muted-foreground">
            {trip?.departure_date && format(parseISO(trip?.departure_date), "dd/MM/yyyy")} {trip?.departure_time}
          </span>
        </>
      ),
    },
    {
      chave: 'lotacao',
      titulo: 'Lotação',
      render: (trip) => (
        <Button type="button" size="sm" title="Passageiros incluindo acompanhantes" aria-label="Passageiros incluindo acompanhantes" onClick={() => handleGoAddClients(trip)}>
          <Users aria-hidden /> {trip?.clients?.length}
        </Button>
      ),
    },
    {
      chave: 'acoes',
      titulo: 'Ações',
      render: (trip) => (
        <div className="flex gap-2">
          <Button type="button" variant="success" size="icon-sm" title="Imprimir Viagem" aria-label="Imprimir Viagem" onClick={() => tripPDF(trip)}>
            <Printer />
          </Button>
          <ActionEditButton title="Editar Viagem" onClick={() => handleGoTrip(trip)} />
          <Button type="button" variant="secondary" size="icon-sm" title="Replicar Viagem" aria-label="Replicar Viagem" onClick={() => setReplicateTrip(trip)}>
            <Copy />
          </Button>
          <ActionDeleteButton title="Excluir Viagem" onClick={() => handleInactiveTrip(trip)} />
        </div>
      ),
    },
  ];

  const semViagens = allTrips.length <= 0;

  const barra = (
    <div className="flex w-full flex-wrap items-end gap-3">
      <CampoDeBusca
        rotulo="Buscar viagem"
        placeholder="Buscar por motorista, destino ou placa"
        name="search"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
      <Interruptor id="modo-busca-viagem" marcado={searchMode === "exclude"} aoMudar={(marcado) => setSearchMode(marcado ? "exclude" : "include")}>
        {searchMode === "exclude" ? "Excluir" : "Incluir"}
      </Interruptor>
      <BasicDatePicker label="Data de Início" name="date_begin" value={dateBegin} setValue={setDateBegin} />
      <BasicDatePicker label="Data de Fim" name="date_end" value={dateEnd} disabled={!dateBegin} setValue={setDateEnd} />
      <Button type="button" title="Buscar" aria-label="Buscar" onClick={getTripsPerDate} disabled={!dateBegin}>
        <Search aria-hidden />
      </Button>
      {profile === "admin" && (
        <>
          <Button type="button" variant="success" size="icon" title="Imprimir PDF com BPA-I" aria-label="imprimir-bpa" disabled={semViagens} onClick={() => bpaTripsPdf(allTrips)}>
            <File />
          </Button>
          <Button type="button" variant="success" size="icon" title="Gerar BPA-I" aria-label="gerar-bpa" disabled={semViagens} onClick={openBpaModal}>
            <Download />
          </Button>
        </>
      )}
      <Button type="button" variant="success" size="icon" title="Imprimir mapa de viagens" aria-label="imprimir-mapa" disabled={semViagens} onClick={() => tripsPDF(allTrips)}>
        <Printer />
      </Button>
      <ActionCreateFab title="Cadastrar viagem" onClick={() => handleGoTrip()} />
    </div>
  );

  return (
    <PaginaDeLista
      titulo={`Você possui ${allTrips.length} Viagens Cadastradas`}
      barra={barra}
      colunas={colunas}
      linhas={fatia}
      chaveDaLinha={(trip) => trip?.id}
      carregando={isOpenLoading && allTrips.length === 0}
      vazio="Nenhuma viagem encontrada."
      rotuloDaTabela="viagens"
      paginacao={propsDaPaginacao}
    >
      <AlertModal />
      <SwitchModal option={option} />

      {trips?.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Interruptor id="marcar-todas-viagens" marcado={selectAllTrips} aoMudar={handleCheckedAllTrips}>
            {selectAllTrips ? "Desmarcar todas as viagens" : "Marcar todas as viagens para impressão"}
          </Interruptor>
          {printTrips?.length > 0 && (
            <Button type="button" size="icon" title="Imprimir mapa de viagens" aria-label="imprimir-selecionadas" disabled={semViagens} onClick={() => printTripsSelectedPDF(printTrips)}>
              <Printer />
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />

      <ReplicateTripModal
        open={!!replicateTrip}
        trip={replicateTrip}
        onClose={() => setReplicateTrip(null)}
      />

      <Dialogo aberto={bpaModalOpen} aoFechar={closeBpaModal} tamanho="sm">
        <DialogoCabecalho>Gerar BPA-I</DialogoCabecalho>
        <div className="grid gap-4">
          <CampoTexto
            id="bpa-cnes"
            label="CNES"
            name="cnes"
            value={bpaForm.cnes}
            onChange={changeBpaForm}
            maxLength={BPA_CNES_MAX_LENGTH}
            inputMode="numeric"
            erro={bpaErrors.cnes}
            dica="Obrigatorio para gerar o arquivo."
          />
          <CampoTexto
            id="bpa-cns"
            label="CNS do medico"
            name="cnsProfissional"
            value={bpaForm.cnsProfissional}
            onChange={changeBpaForm}
            maxLength={15}
            inputMode="numeric"
            erro={bpaErrors.cnsProfissional}
            dica="Obrigatorio para gerar o arquivo."
          />
          <CampoTexto
            id="bpa-cbo"
            label="CBO"
            name="cbo"
            value={bpaForm.cbo}
            onChange={changeBpaForm}
            maxLength={6}
            inputMode="numeric"
            erro={bpaErrors.cbo}
            dica="Obrigatorio para gerar o arquivo."
          />
          <CampoTexto
            id="bpa-autorizacao"
            label="Numero de autorizacao"
            name="numeroAutorizacao"
            value={bpaForm.numeroAutorizacao}
            onChange={changeBpaForm}
            maxLength={BPA_AUTORIZACAO_MAX_LENGTH}
            dica={`Opcional no BPA-I. Maximo de ${BPA_AUTORIZACAO_MAX_LENGTH} caracteres.`}
          />
        </div>
        <DialogoRodape>
          <Button type="button" variant="outline" onClick={closeBpaModal}>Cancelar</Button>
          <Button type="button" variant="success" onClick={handleGenerateBpa}>Gerar arquivo</Button>
        </DialogoRodape>
      </Dialogo>
    </PaginaDeLista>
  );
}
