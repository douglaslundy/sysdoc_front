import React, { useState, useEffect, useContext } from "react";
import Router from "next/router";
import { useSelector, useDispatch } from 'react-redux';
import { parseISO, format } from 'date-fns';
import { Eye } from "lucide-react";
import ViewModelModal from "../modal/model/view";
import AlertModal from "../messagesModal";
import { AuthContext } from "../../contexts/AuthContext";
import { getAllModels } from "../../store/fetchActions/models";
import { showModel } from "../../store/ducks/models";
import { turnModalViewModel } from "../../store/ducks/Layout";
import { Button } from "../ui/button";
import { PaginaDeLista } from "../ui/pagina-de-lista";
import { usePaginacaoLocal } from "../../lib/usePaginacaoLocal";

const safeText = (value, max) => String(value ?? '').substring(0, max).toUpperCase();

const safeDate = (value) => {
    if (!value) return '';
    const date = parseISO(String(value));
    return Number.isNaN(date.getTime()) ? '' : format(date, 'dd/MM/yyyy HH:mm:ss');
};

export default function Models() {
    const dispatch = useDispatch();
    const { models } = useSelector(state => state.models);
    const [searchValue, setSearchValue] = useState('');
    const [allModels, setAllModels] = useState(models);
    const { profile } = useContext(AuthContext);

    useEffect(() => {
        dispatch(getAllModels());
    }, []);

    useEffect(() => {
        setAllModels(searchValue ? [...models.filter(lett => String(lett.number ?? '').includes(searchValue.toString()))] : models);
    }, [models]);

    useEffect(() => {
        if (profile == "user") {
            Router.push('/');
        }
    }, []);

    const handleViewModel = (model) => {
        dispatch(showModel(model));
        dispatch(turnModalViewModel());
    };

    const searchModels = ({ target }) => {
        const valor = target.value.toString();
        setSearchValue(target.value);
        setAllModels(models.filter(
            mod => (mod.sender && mod.sender.toString().includes(valor)) ||
                (mod.recipient && mod.recipient.toString().includes(valor)) ||
                (mod.summary && mod.summary.toString().includes(valor)) ||
                (mod.model && mod.model.toString().includes(valor))
        ));
    };

    const { fatia, propsDaPaginacao } = usePaginacaoLocal(allModels);

    const colunas = [
        {
            chave: 'usuario',
            titulo: 'Usuário / Data',
            render: (model) => (
                <>
                    <span className="block font-semibold">{safeText(model?.user?.name, 30)}</span>
                    <span className="block text-xs text-muted-foreground">{safeDate(model?.created_at)}</span>
                </>
            ),
        },
        {
            chave: 'envolvidos',
            titulo: 'Remetente / Destinatário',
            render: (model) => (
                <>
                    <span className="block font-semibold">{safeText(model.sender, 30)}</span>
                    <span className="block text-xs text-muted-foreground">{safeText(model.recipient, 30)}</span>
                </>
            ),
        },
        {
            chave: 'resumo',
            titulo: 'Resumo / Modelo Criado',
            render: (model) => (
                <>
                    <span className="block font-semibold">{safeText(model.summary, 30)}</span>
                    <span className="block text-xs text-muted-foreground">{safeText(model.model, 40)}</span>
                </>
            ),
        },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (model) => (
                <Button variant="secondary" size="icon-sm" title="Visualizar modelo" aria-label="Visualizar modelo" onClick={() => handleViewModel(model)}>
                    <Eye />
                </Button>
            ),
        },
    ];

    return (
        <PaginaDeLista
            titulo="Modelos"
            subtitulo={`Foram gerados ${allModels.length} Modelos com a Inteligência Artificial`}
            busca={{ rotulo: 'Pesquisar modelos', placeholder: 'Pesquisar um modelo criado', name: 'search', value: searchValue, onChange: searchModels }}
            colunas={colunas}
            linhas={fatia}
            chaveDaLinha={(model) => model.id}
            vazio="Nenhum modelo encontrado."
            rotuloDaTabela="modelos"
            paginacao={propsDaPaginacao}
        >
            <AlertModal />
            <ViewModelModal />
        </PaginaDeLista>
    );
}
