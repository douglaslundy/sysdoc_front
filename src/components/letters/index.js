import React, { useState, useEffect, useContext } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { parseISO, format } from 'date-fns';
import { Paperclip } from "lucide-react";
import { ActionCreateFab, ActionDeleteButton, ActionEditButton, ActionViewButton } from "../actions";
import LetterModal from "../modal/letter";
import ViewLetterModal from "../modal/letter/view";
import { AuthContext } from "../../contexts/AuthContext";
import { getAllLetters, inactiveLetterFetch } from "../../store/fetchActions/letter";
import { showLetter } from "../../store/ducks/letters";
import { changeTitleAlert, openLetterFormModal, turnModalViewLetter } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import Select from '../inputs/selects';
import AlertModal from "../messagesModal";
import { Button } from "../ui/button";
import { PaginaDeLista } from "../ui/pagina-de-lista";
import { usePaginacaoLocal } from "../../lib/usePaginacaoLocal";

export default function Letters() {
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const dispatch = useDispatch();
    const { letters } = useSelector(state => state.letters);
    const [searchValue, setSearchValue] = useState('');
    const [allLetters, setAllLetters] = useState(letters);
    const { user, profile } = useContext(AuthContext);
    const [year, setYear] = useState(new Date().getFullYear());

    const uniqueYears = Array.from(new Set(letters.map(item => new Date(item.created_at).getFullYear())));
    const transformedYears = uniqueYears.map(y => ({ id: y, name: y }));

    useEffect(() => {
        dispatch(getAllLetters());
    }, []);

    useEffect(() => {
        setAllLetters([...letters.filter(lett => new Date(lett.created_at).getFullYear() == year)]);
    }, [year]);

    useEffect(() => {
        // executado apenas quando é carregado a página a primeira vez, ou quando é adicionado um registro
        setAllLetters(searchValue ?
            [...letters.filter(lett => lett.number.toString().toLowerCase().includes(searchValue.toString().toLowerCase()))
                .filter(lett => new Date(lett.created_at).getFullYear() == year)]
            : [...letters.filter(lett => new Date(lett.created_at).getFullYear() == year)]);
    }, [letters]);

    const handleViewLetter = (letter) => {
        dispatch(showLetter(letter));
        dispatch(turnModalViewLetter());
    };

    const handleEditLetter = (letter) => {
        dispatch(showLetter(letter));
        dispatch(openLetterFormModal());
    };

    const handleInactiveLetter = (letter) => {
        setConfirmDialog({ ...confirmDialog, isOpen: true, title: `Deseja Realmente Excluir o Ofício ${letter.number}`, confirm: inactiveLetterFetch(letter) });
        dispatch(changeTitleAlert(`O ofício ${letter.number} foi excluido com sucesso!`));
    };

    const searchLetters = ({ target }) => {
        const termo = target.value.toString().toLowerCase();
        setSearchValue(target.value);
        const contem = (valor) => valor && valor.toString().toLowerCase().includes(termo);
        setAllLetters(letters
            .filter(lett => new Date(lett.created_at).getFullYear() == year)
            .filter(lett => contem(lett.number) || contem(lett.sender) || contem(lett.recipient) || contem(lett.subject_matter)));
    };

    const { fatia, propsDaPaginacao } = usePaginacaoLocal(allLetters);

    const colunas = [
        {
            chave: 'numero',
            titulo: 'Número / Data',
            render: (letter) => (
                <>
                    <span className="block font-display text-3xl font-bold leading-none">{letter && letter.number}</span>
                    <span className="block text-xs text-muted-foreground">{letter.created_at && format(parseISO(letter.created_at), 'dd/MM/yyyy HH:mm:ss')}</span>
                </>
            ),
        },
        {
            chave: 'envolvidos',
            titulo: 'Remetente / Destinatário',
            render: (letter) => (
                <>
                    <span className="block font-semibold">{letter.sender.substring(0, 30).toUpperCase()}</span>
                    <span className="block text-xs text-muted-foreground">{letter.recipient.substring(0, 30).toUpperCase()}</span>
                </>
            ),
        },
        {
            chave: 'usuario',
            titulo: 'Usuário / Assunto',
            render: (letter) => (
                <>
                    <span className="block font-semibold">{letter.user.name.substring(0, 30).toUpperCase()}</span>
                    <span className="block text-xs text-muted-foreground">{letter.subject_matter.substring(0, 40).toUpperCase()}</span>
                </>
            ),
        },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (letter, index) => (
                <div className="flex gap-2">
                    <ActionViewButton title="Visualizar Ofício" onClick={() => handleViewLetter(letter)} />
                    {Number(letter?.attachments_count || 0) > 0 && (
                        <Button variant="secondary" size="icon-sm" disabled title={`${letter.attachments_count} anexo(s)`} aria-label={`${letter.attachments_count} anexo(s)`}>
                            <Paperclip />
                        </Button>
                    )}
                    <ActionEditButton title="Editar Ofício" onClick={() => handleEditLetter(letter)} disabled={profile != "admin" && letter.id_user != user} />
                    <ActionDeleteButton title="Excluir Ofício" onClick={() => handleInactiveLetter(letter)} disabled={letter.id_user == user || profile == "admin" ? index !== 0 : true} />
                </div>
            ),
        },
    ];

    const barra = (
        <>
            <Select label="Ano" name="year" value={year} store={transformedYears} changeItem={({ target }) => setYear(target.value)} wd="140px" />
            <LetterModal>
                <ActionCreateFab title="Novo ofício" onClick={() => dispatch(openLetterFormModal())} />
            </LetterModal>
        </>
    );

    return (
        <PaginaDeLista
            titulo="Ofícios"
            subtitulo={`Você possui ${allLetters.length} ofícios Cadastrados`}
            busca={{ rotulo: 'Pesquisar ofício', placeholder: 'Pesquisar ofício', name: 'search', value: searchValue, onChange: searchLetters }}
            barra={barra}
            colunas={colunas}
            linhas={fatia}
            chaveDaLinha={(letter) => letter.id}
            vazio="Nenhum registro encontrado!"
            rotuloDaTabela="ofícios"
            paginacao={propsDaPaginacao}
        >
            <AlertModal />
            <ViewLetterModal />
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </PaginaDeLista>
    );
}
