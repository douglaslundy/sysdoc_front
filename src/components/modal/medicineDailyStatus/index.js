import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { upsertDailyStatusFetch } from '../../../store/fetchActions/medicineDailyStatuses';
import { getMedicinesSelect } from '../../../store/fetchActions/medicines';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';

const EMPTY = {
    medicine_item_id: '',
    reference_date: '',
    availability_status: 'available',
    available_quantity: '',
    restock_forecast_date: '',
    public_note: '',
};

const localDate = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export default function MedicineDailyStatusDialog({ open, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const { medicines } = useSelector(state => state.medicines);
    const [form, setForm] = useState(EMPTY);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (open) {
            dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
            setForm({ ...EMPTY, reference_date: localDate() });
            setErrorMessage('');
        }
    }, [open, dispatch]);

    const change = ({ target: { name, value } }) => {
        setForm(f => ({ ...f, [name]: value }));
        if (errorMessage) setErrorMessage('');
    };

    const save = () => {
        dispatch(upsertDailyStatusFetch({
            ...form,
            available_quantity: form.available_quantity === '' ? null : Number(form.available_quantity),
            restock_forecast_date: form.restock_forecast_date || null,
            public_note: form.public_note || null,
        }, onSuccess, setErrorMessage));
    };

    return (
        <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="md">
            <DialogoCabecalho>Atualizar Status Diário</DialogoCabecalho>
            <div className="grid gap-4">
                {errorMessage ? <Banner tom="perigo">{errorMessage}</Banner> : null}
                <CampoSelecao id="ds-medicamento" name="medicine_item_id" label="Medicamento" value={form.medicine_item_id} onChange={({ target }) => change({ target: { name: target.name, value: target.value === '' ? '' : Number(target.value) } })} obrigatorio>
                    <option value="" />
                    {medicines.map((m) => <option key={m.id} value={m.id}>{m.active_ingredient} {m.concentration}</option>)}
                </CampoSelecao>
                <CampoTexto id="ds-data" name="reference_date" label="Data de Referência" type="date" value={form.reference_date} onChange={change} obrigatorio />
                <CampoSelecao id="ds-disponibilidade" name="availability_status" label="Disponibilidade" value={form.availability_status} onChange={change} obrigatorio>
                    <option value="available">Disponível</option>
                    <option value="unavailable">Indisponível</option>
                </CampoSelecao>
                <CampoTexto id="ds-quantidade" name="available_quantity" type="number" label="Quantidade Disponível" value={form.available_quantity} onChange={change} />
                <CampoTexto id="ds-reposicao" name="restock_forecast_date" label="Previsão de Reposição" type="date" value={form.restock_forecast_date} onChange={change} />
                <CampoTexto id="ds-nota" name="public_note" label="Observação Pública" value={form.public_note} onChange={change} />
            </div>
            <DialogoRodape>
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="button" onClick={save}>Salvar</Button>
            </DialogoRodape>
        </Dialogo>
    );
}
