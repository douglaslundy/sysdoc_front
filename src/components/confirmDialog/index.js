import React from 'react';
import { useDispatch } from 'react-redux';
import { AlertTriangle } from 'lucide-react';

import { Button } from '../ui/button';
import { Dialogo, DialogoDescricao, DialogoRodape, DialogoTitulo } from '../ui/dialogo';

export default function ConfirmDialog(props) {
    const { confirmDialog, setConfirmDialog } = props;
    const dispatch = useDispatch();

    const fechar = () => setConfirmDialog({ ...confirmDialog, isOpen: false });

    const handleConfirm = () => {
        if (typeof confirmDialog.onConfirm === 'function') {
            confirmDialog.onConfirm();
        } else if (confirmDialog.confirm) {
            dispatch(confirmDialog.confirm);
        }
        fechar();
    };

    return (
        <Dialogo aberto={Boolean(confirmDialog.isOpen)} aoFechar={fechar} tamanho="sm" alerta>
            <div className="flex flex-col items-center gap-3 text-center">
                <AlertTriangle aria-hidden className="size-14 text-primary-text" />
                <DialogoTitulo>{confirmDialog.title}</DialogoTitulo>
                {confirmDialog.subTitle ? <DialogoDescricao render={<div />}>{confirmDialog.subTitle}</DialogoDescricao> : null}
            </div>
            <DialogoRodape className="sm:justify-center">
                <Button variant="outline" onClick={fechar}>Não</Button>
                <Button variant="destructive" onClick={handleConfirm}>Sim</Button>
            </DialogoRodape>
        </Dialogo>
    );
}
