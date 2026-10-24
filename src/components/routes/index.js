import React, { useState, useEffect, useContext, useMemo } from "react";
import { Plus } from "lucide-react";

import RouteModal from "../modal/routes";
import { AuthContext } from "../../contexts/AuthContext";
import { useSelector, useDispatch } from 'react-redux';
import { getAllRoutes, inactiveRouteFetch } from "../../store/fetchActions/routes";
import { showRoute } from "../../store/ducks/routes";
import { changeTitleAlert, openRoutesModal } from "../../store/ducks/Layout";
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
    const { routes } = useSelector(state => state.routes);
    const [searchValue, setSearchValue] = useState("");
    const { user, profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllRoutes());
    }, []);

    const allRoutes = useMemo(
        () => (searchValue
            ? routes.filter(r => r.destination && r.destination.toString().toLowerCase().includes(searchValue.toString().toLowerCase()))
            : routes),
        [routes, searchValue],
    );
    const { fatia, propsDaPaginacao } = usePaginacaoLocal(allRoutes);

    const HandleEditRoute = async route => {
        dispatch(showRoute(route));
        dispatch(openRoutesModal());
    };

    const HandleInactiveRoute = async route => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir a Sala ${route.license_plate}`, confirm: inactiveRouteFetch(route) });
        dispatch(changeTitleAlert(`A rota ${route.origin.toUpperCase()} - ${route.destination.toUpperCase()} foi excluída com sucesso!`));
    };

    const colunas = [
        { chave: "id", titulo: "ID", numerica: true, render: (r) => r.id },
        {
            chave: "rota",
            titulo: "Origem x Destino / Usuário",
            render: (r) => (
                <>
                    <span className="font-semibold">
                        {r.origin && r.origin.substring(0, 30).toUpperCase()} - {r.origin_state && r.origin_state} X {r.destination && r.destination.substring(0, 30).toUpperCase()} - {r.destination && r.destination_state}
                    </span>
                    <span className="block text-xs text-muted-foreground">{r.user && r.user.name.substring(0, 30).toUpperCase()}</span>
                </>
            ),
        },
        { chave: "distancia", titulo: "Distância", render: (r) => <span className="font-semibold">{r.distance && r.distance} KM</span> },
        {
            chave: "acoes",
            titulo: "Ações",
            render: (r) => (
                <AcoesDeLinha
                    rotuloEditar="Editar Rota"
                    rotuloExcluir="Excluir Rota"
                    desativado={profile != "admin" && r.id_user != user}
                    aoEditar={() => HandleEditRoute(r)}
                    aoExcluir={() => HandleInactiveRoute(r)}
                />
            ),
        },
    ];

    return (
        <PaginaDeLista
            titulo="Rotas"
            subtitulo={`Você possui ${allRoutes.length} rotas cadastradas`}
            busca={{ rotulo: "Pesquisar rota por destino", placeholder: "Pesquisar rota por destino", name: "search", maxLength: 50, value: searchValue, onChange: ({ target }) => setSearchValue(target.value) }}
            barra={(
                <RouteModal>
                    <Button onClick={() => dispatch(openRoutesModal())}><Plus /> Nova rota</Button>
                </RouteModal>
            )}
            colunas={colunas}
            linhas={fatia}
            chaveDaLinha={(r) => r.id}
            vazio="Nenhuma rota encontrada!"
            paginacao={propsDaPaginacao}
        >
            <AlertModal />
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </PaginaDeLista>
    );
};
