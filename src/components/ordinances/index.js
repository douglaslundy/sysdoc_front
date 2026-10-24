import React, { useState, useEffect, useContext } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { parseISO, format } from 'date-fns';
import { Paperclip } from "lucide-react";
import { ActionCreateFab, ActionDeleteButton, ActionEditButton, ActionViewButton } from "../actions";
import OrdinanceModal from "../modal/ordinance";
import ViewOrdinanceModal from "../modal/ordinance/view";
import { AuthContext } from "../../contexts/AuthContext";
import { getAllOrdinances, inactiveOrdinanceFetch } from "../../store/fetchActions/ordinances";
import { showOrdinance } from "../../store/ducks/ordinances";
import { changeTitleAlert, openOrdinanceModal, turnModalViewLetter } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import Select from '../inputs/selects';
import AlertModal from "../messagesModal";
import { Button } from "../ui/button";
import { PaginaDeLista } from "../ui/pagina-de-lista";
import { usePaginacaoLocal } from "../../lib/usePaginacaoLocal";

const CAMPOS_DA_BUSCA = ['number', 'title', 'subject', 'summary', 'content', 'legal_basis', 'signatory_name'];

export default function Ordinances() {
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const dispatch = useDispatch();
    const { ordinances } = useSelector(state => state.ordinances);
    const [searchValue, setSearchValue] = useState("");
    const [allOrdinances, setAllOrdinances] = useState([]);
    const { user, profile } = useContext(AuthContext);
    const [year, setYear] = useState(new Date().getFullYear());

    const uniqueYears = Array.from(new Set(ordinances.filter(item => item.created_at).map(item => new Date(item.created_at).getFullYear())));
    const transformedYears = uniqueYears.map(y => ({ id: y, name: y }));

    useEffect(() => {
        dispatch(getAllOrdinances());
    }, []);

    useEffect(() => {
        const termo = searchValue.toString().toLowerCase();
        const doAno = ordinances.filter(item => new Date(item.created_at).getFullYear() == year);
        setAllOrdinances(termo
            ? doAno.filter(item => CAMPOS_DA_BUSCA.some(campo => item[campo] && item[campo].toString().toLowerCase().includes(termo)))
            : doAno);
    }, [searchValue, ordinances, year]);

    const handleViewOrdinance = (ordinance) => {
        dispatch(showOrdinance(ordinance));
        dispatch(turnModalViewLetter());
    };

    const handleEditOrdinance = (ordinance) => {
        dispatch(showOrdinance(ordinance));
        dispatch(openOrdinanceModal());
    };

    const handleInactiveOrdinance = (ordinance) => {
        setConfirmDialog({
            ...confirmDialog,
            isOpen: true,
            title: `Deseja Realmente Excluir a Portaria ${ordinance.number}`,
            confirm: inactiveOrdinanceFetch(ordinance),
        });
        dispatch(changeTitleAlert(`A Portaria ${ordinance.number} foi excluída com sucesso!`));
    };

    const { fatia, propsDaPaginacao } = usePaginacaoLocal(allOrdinances);

    const colunas = [
        {
            chave: 'numero',
            titulo: 'Número / Data',
            render: (ordinance) => (
                <>
                    <span className="block font-display text-3xl font-bold leading-none">{ordinance.number}</span>
                    <span className="block text-xs text-muted-foreground">{ordinance.created_at && format(parseISO(ordinance.created_at), 'dd/MM/yyyy HH:mm:ss')}</span>
                </>
            ),
        },
        {
            chave: 'titulo',
            titulo: 'Título / Assunto',
            render: (ordinance) => (
                <>
                    <span className="block font-semibold">{ordinance.title ? ordinance.title.substring(0, 40).toUpperCase() : ''}</span>
                    <span className="block text-xs text-muted-foreground">{ordinance.subject ? ordinance.subject.substring(0, 50).toUpperCase() : ''}</span>
                </>
            ),
        },
        {
            chave: 'usuario',
            titulo: 'Usuário / Tipo',
            render: (ordinance) => (
                <>
                    <span className="block font-semibold">{ordinance.user && ordinance.user.name ? ordinance.user.name.substring(0, 30).toUpperCase() : ''}</span>
                    <span className="block text-xs text-muted-foreground">{ordinance.type ? ordinance.type.toUpperCase() : ''}</span>
                </>
            ),
        },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (ordinance, index) => (
                <div className="flex gap-2">
                    <ActionViewButton title="Visualizar Portaria" onClick={() => handleViewOrdinance(ordinance)} />
                    {Number(ordinance?.attachments_count || 0) > 0 && (
                        <Button variant="secondary" size="icon-sm" disabled title={`${ordinance.attachments_count} anexo(s)`} aria-label={`${ordinance.attachments_count} anexo(s)`}>
                            <Paperclip />
                        </Button>
                    )}
                    <ActionEditButton title="Editar Portaria" onClick={() => handleEditOrdinance(ordinance)} disabled={profile != "admin" && ordinance.user_id != user} />
                    <ActionDeleteButton title="Excluir Portaria" onClick={() => handleInactiveOrdinance(ordinance)} disabled={ordinance.user_id == user || profile == "admin" ? index !== 0 : true} />
                </div>
            ),
        },
    ];

    const barra = (
        <>
            <Select label="Ano" name="year" value={year} store={transformedYears} changeItem={({ target }) => setYear(target.value)} wd="140px" />
            <OrdinanceModal>
                <ActionCreateFab title="Nova portaria" onClick={() => dispatch(openOrdinanceModal())} />
            </OrdinanceModal>
        </>
    );

    return (
        <PaginaDeLista
            titulo="Portarias"
            subtitulo={`Você possui ${allOrdinances.length} portarias cadastradas`}
            busca={{ rotulo: 'Pesquisar portaria', placeholder: 'Pesquisar portaria', name: 'search', value: searchValue, onChange: ({ target }) => setSearchValue(target.value) }}
            barra={barra}
            colunas={colunas}
            linhas={fatia}
            chaveDaLinha={(ordinance) => ordinance.id}
            vazio="Nenhum registro encontrado!"
            rotuloDaTabela="portarias"
            paginacao={propsDaPaginacao}
        >
            <AlertModal />
            <ViewOrdinanceModal />
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </PaginaDeLista>
    );
}
