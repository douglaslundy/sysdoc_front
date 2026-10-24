import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { parseISO, format } from 'date-fns';
import { showOrdinance } from '../../../../store/ducks/ordinances';
import { turnModalViewLetter } from '../../../../store/ducks/Layout';
import { Button } from '../../../ui/button';
import { Dado } from '../../../ui/dado';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../../ui/dialogo';

const VAZIO = {
    year: '', type: '', title: '', subject: '', summary: '', content: '', legal_basis: '',
    department: '', signatory_name: '', signatory_role: '', publication_date: '', notes: '', created_at: '',
};

export default function ViewOrdinanceModal(props) {
    const [item, setItem] = useState(VAZIO);
    const { ordinance } = useSelector(state => state.ordinances);
    const { isOpenLetterModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const cleanItem = () => {
        setItem(VAZIO);
        dispatch(turnModalViewLetter());
        dispatch(showOrdinance({}));
    };

    useEffect(() => {
        if (ordinance && ordinance.id) setItem(ordinance);
    }, [ordinance]);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenLetterModal)} aoFechar={cleanItem} tamanho="lg">
                <DialogoCabecalho>{ordinance && ordinance.id ? `Portaria ${ordinance.number}` : 'Você não selecionou uma portaria válida'}</DialogoCabecalho>
                <div className="grid gap-4">
                    <Dado rotulo="Título">{item.title}</Dado>
                    <Dado rotulo="Assunto">{item.subject}</Dado>
                    <Dado rotulo="Tipo / Ano">{item.type} / {item.year}</Dado>
                    <Dado rotulo="Setor">{item.department}</Dado>
                    <Dado rotulo="Signatário">{item.signatory_name} {item.signatory_role ? `- ${item.signatory_role}` : ''}</Dado>
                    <Dado rotulo="Resumo">{item.summary}</Dado>
                    <Dado rotulo="Fundamentação Legal">{item.legal_basis}</Dado>
                    <Dado rotulo="Conteúdo da Portaria"><span className="whitespace-pre-wrap">{item.content}</span></Dado>
                    <Dado rotulo="Data de Publicação">{item.publication_date || '---'}</Dado>
                    <Dado rotulo="Observações">{item.notes}</Dado>
                    <div className="text-right text-sm">
                        <p className="font-semibold">{ordinance && ordinance.user && ordinance.user.name}</p>
                        <p>{item.created_at && format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
                    </div>
                </div>
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={cleanItem}>Voltar</Button>
                </DialogoRodape>
            </Dialogo>
        </div>
    );
}
