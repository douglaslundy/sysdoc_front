import React, { useState, useEffect, useContext, useMemo } from "react";
import { Plus } from "lucide-react";

import VehicleModal from "../modal/vehicles";
import { AuthContext } from "../../contexts/AuthContext";
import { useSelector, useDispatch } from 'react-redux';
import { getAllVehicles, inactiveVehicleFetch } from "../../store/fetchActions/vehicles";
import { showVehicle } from "../../store/ducks/vehicles";
import { changeTitleAlert, openVehiclesModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { usePaginacaoLocal } from "../../lib/usePaginacaoLocal";
import { AcoesDeLinha } from "../ui/acoes-de-linha";
import { Button } from "../ui/button";
import { PaginaDeLista } from "../ui/pagina-de-lista";

export default () => {
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const dispatch = useDispatch();
    const { vehicles } = useSelector(state => state.vehicles);
    const [searchValue, setSearchValue] = useState("");
    const { user, profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllVehicles());
    }, []);

    const allVehicles = useMemo(
        () => (searchValue
            ? vehicles.filter(v => v.license_plate && v.license_plate.toString().toLowerCase().includes(searchValue.toString().toLowerCase()))
            : vehicles),
        [vehicles, searchValue],
    );
    const { fatia, propsDaPaginacao } = usePaginacaoLocal(allVehicles);

    const HandleEditVehicle = async vehicle => {
        dispatch(showVehicle(vehicle));
        dispatch(openVehiclesModal());
    };

    const HandleInactiveVehicle = async vehicle => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir a Sala ${vehicle.license_plate}`, confirm: inactiveVehicleFetch(vehicle) });
        dispatch(changeTitleAlert(`O Veículo ${vehicle.brand.toUpperCase()} ${vehicle.model.toUpperCase()} PLACA ${vehicle.license_plate.toUpperCase()} foi excluído com sucesso!`));
    };

    const colunas = [
        { chave: "placa", titulo: "Placa", render: (v) => <span className="text-lg font-semibold">{v.license_plate && v.license_plate.substring(0, 10).toUpperCase()}</span> },
        {
            chave: "veiculo",
            titulo: "Marca / Modelo / Cor / Capacidade / Usuário",
            render: (v) => (
                <>
                    <span className="font-semibold">
                        {v.brand && v.brand.substring(0, 10).toUpperCase()} {v.model && v.model.substring(0, 10).toUpperCase()} - {v.color && v.color.substring(0, 10).toUpperCase()} - {v.year && v.year} / {v.capacity && v.capacity} Lugares
                    </span>
                    <span className="block text-xs text-muted-foreground">{v.user && v.user.name.toUpperCase()}</span>
                </>
            ),
        },
        {
            chave: "documentos",
            titulo: "Renavan / Chassi",
            render: (v) => (
                <>
                    <span className="font-semibold">{v.renavan && v.renavan.substring(0, 15).toUpperCase()}</span>
                    <span className="block text-xs text-muted-foreground">{v.chassis && v.chassis.substring(0, 15).toUpperCase()}</span>
                </>
            ),
        },
        {
            chave: "acoes",
            titulo: "Ações",
            render: (v) => (
                <AcoesDeLinha
                    rotuloEditar="Editar Veículo"
                    rotuloExcluir="Excluir Veículo"
                    desativado={profile != "admin" && v.id_user != user}
                    aoEditar={() => HandleEditVehicle(v)}
                    aoExcluir={() => HandleInactiveVehicle(v)}
                />
            ),
        },
    ];

    return (
        <PaginaDeLista
            titulo="Veículos"
            subtitulo={`Você possui ${allVehicles.length} veículos cadastrados`}
            busca={{ rotulo: "Pesquisar veículo por placa", placeholder: "Pesquisar veículo por placa", name: "search", maxLength: 50, value: searchValue, onChange: ({ target }) => setSearchValue(target.value) }}
            barra={(
                <VehicleModal>
                    <Button onClick={() => dispatch(openVehiclesModal())}><Plus /> Novo veículo</Button>
                </VehicleModal>
            )}
            colunas={colunas}
            linhas={fatia}
            chaveDaLinha={(v) => v.id}
            vazio="Nenhum veículo encontrado!"
            paginacao={propsDaPaginacao}
        >
            <AlertModal />
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </PaginaDeLista>
    );
};
