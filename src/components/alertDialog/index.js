import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, XCircle } from 'lucide-react';

import { alterTypeOfAlert, turnAlert } from '../../store/ducks/Layout';
import { Button } from '../ui/button';
import { Dialogo, DialogoDescricao, DialogoRodape, DialogoTitulo } from '../ui/dialogo';

export default function AlertDialog() {
    const { isOpenAlert, titleAlert, subTitleAlert, typeAlertIsSuccess } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const handleOk = () => {
        dispatch(turnAlert());
        dispatch(alterTypeOfAlert(true));
    };

    const Icone = typeAlertIsSuccess ? CheckCircle2 : XCircle;

    return (
        <Dialogo aberto={Boolean(isOpenAlert)} aoFechar={() => dispatch(turnAlert())} tamanho="sm" alerta>
            <div className="flex flex-col items-center gap-3 text-center">
                <Icone aria-hidden className={typeAlertIsSuccess ? 'size-14 text-success' : 'size-14 text-danger'} />
                <DialogoTitulo>{titleAlert}</DialogoTitulo>
                {subTitleAlert ? <DialogoDescricao>{subTitleAlert}</DialogoDescricao> : null}
            </div>
            <DialogoRodape className="sm:justify-center">
                <Button onClick={handleOk}>OK</Button>
            </DialogoRodape>
        </Dialogo>
    );
}
