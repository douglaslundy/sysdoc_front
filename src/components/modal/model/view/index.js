import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { parseISO, format } from 'date-fns';
import { showModel } from '../../../../store/ducks/models';
import { turnModalViewModel } from '../../../../store/ducks/Layout';
import { Button } from '../../../ui/button';
import { Dado } from '../../../ui/dado';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../../ui/dialogo';

const VAZIO = { summary: '', prompt: '', model: '', subject: '', sender: '', recipient: '', created_at: '' };

export default function ViewModelModal(props) {
    const [mod, setMod] = useState(VAZIO);
    const { summary, prompt, model, subject, sender, recipient, created_at } = mod;

    const { model: md } = useSelector(state => state.models);
    const { isOpenModelModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const cleanMod = () => {
        setMod(VAZIO);
        dispatch(turnModalViewModel());
        dispatch(showModel({}));
    };

    useEffect(() => {
        if (md && md.id) setMod(md);
    }, [md]);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenModelModal)} aoFechar={cleanMod} tamanho="lg">
                <DialogoCabecalho>{md && md.id ? `Modelo ${md.id}` : 'Você não selecionou um ofício válido'}</DialogoCabecalho>
                <div className="grid gap-4">
                    <Dado rotulo="Remetente"><span className="uppercase">{sender}</span></Dado>
                    <Dado rotulo="Destinatário"><span className="uppercase">{recipient}</span></Dado>
                    <Dado rotulo="Assunto"><span className="uppercase">{subject}</span></Dado>
                    <Dado rotulo="Resumo"><span className="uppercase">{summary}</span></Dado>
                    <Dado rotulo="Prompt utilizado"><span className="whitespace-pre-wrap">{prompt}</span></Dado>
                    <Dado rotulo="Modelo Criado com Inteligência Artificial"><span className="whitespace-pre-wrap">{model}</span></Dado>
                    <div className="text-right text-sm">
                        <p className="font-semibold">{md && md.user && md.user.name}</p>
                        <p>{created_at && format(parseISO(created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
                    </div>
                </div>
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={cleanMod}>Voltar</Button>
                </DialogoRodape>
            </Dialogo>
        </div>
    );
}
