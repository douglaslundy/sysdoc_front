import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showQueue } from '../../../store/ducks/queues';
import { closeOutcomeQueueModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editDoneQueue } from '../../../store/fetchActions/queues';
import AlertModal from '../../messagesModal';
import BlockingErrorDialog from '../../messagesModal/BlockingErrorDialog';
import ConfirmDialog from "../../confirmDialog";
import BasicDatePicker from "../../inputs/datePicker";
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';

export default function QueueModal(props) {
    const [form, setForm] = useState({
        date_of_realized: "",
    });

    const { date_of_realized, obsConclusion } = form;
    const { queue } = useSelector(state => state.queues);
    const { isOpenOutcomeQueueModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja Realmente finalizar a especialidade',
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const [texto, setTexto] = useState('');
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const changeItem = ({ target: { name, value } }) => {
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSetDn = (value) => {
        setForm((f) => ({ ...f, date_of_realized: value }));
    };

    const cleanForm = () => {
        setForm({
            date_of_realized: "",
        });
        setTexto('');
        dispatch(closeOutcomeQueueModal());
        dispatch(showQueue({}));
        if (typeof props.onAfterClose === 'function') {
            props.onAfterClose();
        }
    }

    const handleSaveData = async () => {
        queue && queue.id ? handlePutData() : null
    }

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`A especialidade foi atualizada com sucesso!`));
        setConfirmDialog({
            ...confirmDialog,
            isOpen: true,
            title: `Deseja Realmente finalizar a especialidade ${queue.id}`,
            confirm: null,
            onConfirm: () => {
                setSaving(true);
                dispatch(editDoneQueue(form, cleanForm, {
                    onSaved: (saved) => {
                        setSaving(false);
                        typeof props.onSaved === 'function' && props.onSaved(saved);
                    },
                    onError: (message) => {
                        setSaving(false);
                        setErrorMessage(message);
                    },
                }));
            },
        })
    };

    useEffect(() => {
        if (queue && queue.id)
            setForm(queue);

    }, [queue]);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenOutcomeQueueModal)} aoFechar={cleanForm} tamanho="lg">
                <DialogoCabecalho>
                    {queue && queue.id ? ` ${queue.id} - CLIENTE: ${queue?.client?.name} - ESPECIALIDADE: ${queue?.speciality?.name} ` : "Não foi encontrado nada aqui "}
                </DialogoCabecalho>
                <AlertModal />
                {texto && <div className="mb-4"><Banner tom="alerta">{texto}</Banner></div>}

                <h4 className="mb-3 font-display text-sm font-bold">DESFECHO: Agendar ou Finalizar Este Cliente na Fila de Especialidade:</h4>

                <div className="grid gap-4">
                    {isOpenOutcomeQueueModal && (
                        <BasicDatePicker
                            label="Informe a data do desfecho"
                            name="date_of_realized"
                            value={date_of_realized}
                            setValue={handleSetDn}
                            required
                        />
                    )}

                    <div>
                        <h4 className="font-display text-sm font-bold">OBS:</h4>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{queue?.obs ? queue.obs : ''}</p>
                    </div>

                    <CampoTexto
                        id="Obs"
                        label={obsConclusion && obsConclusion.length > 0 ? `Observações: ${200 - obsConclusion.length} caracteres restantes` : 'Observações'}
                        multiline
                        rows={2}
                        value={obsConclusion ? obsConclusion : ''}
                        name="obsConclusion"
                        onChange={changeItem}
                        maxLength={200}
                        className="uppercase"
                    />
                </div>

                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={cleanForm}>Cancelar</Button>
                    <Button type="button" onClick={handleSaveData} disabled={saving}>{saving ? 'Gravando...' : 'Gravar'}</Button>
                </DialogoRodape>
            </Dialogo>
            <ConfirmDialog
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog} />
            <BlockingErrorDialog
                open={Boolean(errorMessage)}
                title="Não foi possível dar baixa"
                message={errorMessage}
                onClose={() => setErrorMessage('')}
            />
        </div>
    );
}
