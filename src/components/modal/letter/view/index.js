import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { parseISO, format } from 'date-fns';
import { showLetter } from '../../../../store/ducks/letters';
import { turnModalViewLetter } from '../../../../store/ducks/Layout';
import { Button } from '../../../ui/button';
import { Dado } from '../../../ui/dado';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../../ui/dialogo';

const VAZIO = { sender: '', recipient: '', subject_matter: '', obs: '', summary: '', created_at: '' };

export default function ViewLetterModal(props) {
    const [lett, setLett] = useState(VAZIO);
    const { sender, recipient, subject_matter, obs, summary, created_at } = lett;

    const { letter } = useSelector(state => state.letters);
    const { isOpenLetterModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const cleanLett = () => {
        setLett(VAZIO);
        dispatch(turnModalViewLetter());
        dispatch(showLetter({}));
    };

    useEffect(() => {
        if (letter && letter.id) setLett(letter);
    }, [letter]);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenLetterModal)} aoFechar={cleanLett} tamanho="lg">
                <DialogoCabecalho>{letter && letter.id ? `Ofício ${letter.number}` : 'Você não selecionou um ofício válido'}</DialogoCabecalho>
                <div className="grid gap-4">
                    <Dado rotulo="Remetente"><span className="uppercase">{sender}</span></Dado>
                    <Dado rotulo="Destinatário"><span className="uppercase">{recipient}</span></Dado>
                    <Dado rotulo="Assunto"><span className="uppercase">{subject_matter}</span></Dado>
                    <Dado rotulo="Resumo"><span className="uppercase">{summary}</span></Dado>
                    <Dado rotulo="Modelo Criado com Inteligência Artificial"><span className="whitespace-pre-wrap">{obs}</span></Dado>
                    <div className="text-right text-sm">
                        <p className="font-semibold">{letter && letter.user && letter.user.name}</p>
                        <p>{created_at && format(parseISO(created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
                    </div>
                </div>
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={cleanLett}>Voltar</Button>
                </DialogoRodape>
            </Dialogo>
        </div>
    );
}
