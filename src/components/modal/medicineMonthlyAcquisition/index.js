import { useEffect, useState } from 'react';
import InputMask from 'react-input-mask';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../../services/api';
import { addAlertMessage } from '../../../store/ducks/Layout';
import { upsertMonthlyAcquisitionFetch } from '../../../store/fetchActions/medicineMonthlyAcquisitions';
import { getMedicinesSelect } from '../../../store/fetchActions/medicines';
import { Campo, Input } from '../../ui/campos';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';

const EMPTY = {
    medicine_item_id: '',
    reference_month: '',
    acquired_quantity: '',
    unit_measure: '',
    source_document: '',
    note: '',
};

export default function MedicineMonthlyAcquisitionDialog({ open, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const { medicines } = useSelector(state => state.medicines);
    const [form, setForm] = useState(EMPTY);
    const [units, setUnits] = useState([]);
    const [sources, setSources] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    const toApiMonth = (masked) => {
        const parts = (masked || '').replace(/_/g, '').split('/');
        if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 4) return '';
        return `${parts[1]}-${parts[0]}`;
    };

    useEffect(() => {
        if (open) {
            dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
            const now = new Date();
            const maskedDefault = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
            setForm({ ...EMPTY, reference_month: maskedDefault });
            setErrorMessage('');
            api.get('/pharmacy/catalogs')
                .then((res) => {
                    setUnits(res.data?.units || []);
                    setSources(res.data?.acquisition_sources || []);
                })
                .catch(() => dispatch(addAlertMessage('Não foi possível carregar os catálogos da farmácia.')));
        }
    }, [open]);

    const change = ({ target: { name, value } }) => {
        setForm(f => ({ ...f, [name]: value }));
        if (errorMessage) setErrorMessage('');
    };

    const validate = () => {
        if (!form.medicine_item_id) return 'Selecione um medicamento.';
        if (!toApiMonth(form.reference_month)) return 'Informe o mês de referência (MM/AAAA).';
        if (form.acquired_quantity === '' || Number(form.acquired_quantity) < 0) return 'Informe a quantidade adquirida.';
        if (!form.unit_measure) return 'Selecione a unidade de medida.';
        return '';
    };

    const save = () => {
        const validationError = validate();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }
        dispatch(upsertMonthlyAcquisitionFetch({
            ...form,
            reference_month: toApiMonth(form.reference_month),
            acquired_quantity: Number(form.acquired_quantity || 0),
            source_document: form.source_document || null,
            note: form.note || null,
        }, onSuccess, setErrorMessage));
    };

    return (
        <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="md">
            <DialogoCabecalho>Aquisição Mensal</DialogoCabecalho>
            <div className="grid gap-4">
                {errorMessage ? <Banner tom="perigo">{errorMessage}</Banner> : null}
                <CampoSelecao id="am-medicamento" name="medicine_item_id" label="Medicamento" value={form.medicine_item_id} onChange={({ target }) => change({ target: { name: target.name, value: target.value === '' ? '' : Number(target.value) } })} obrigatorio>
                    <option value="" />
                    {medicines.map((m) => <option key={m.id} value={m.id}>{m.active_ingredient} {m.concentration}</option>)}
                </CampoSelecao>
                <Campo id="am-mes" label="Mês de Referência" obrigatorio>
                    {(p) => (
                        <InputMask mask="99/9999" value={form.reference_month} onChange={change}>
                            {(inputProps) => <Input {...inputProps} {...p} name="reference_month" placeholder="MM/AAAA" inputMode="numeric" />}
                        </InputMask>
                    )}
                </Campo>
                <CampoTexto id="am-quantidade" name="acquired_quantity" type="number" label="Quantidade Adquirida" value={form.acquired_quantity} onChange={change} obrigatorio />
                <CampoSelecao id="am-unidade" name="unit_measure" label="Unidade de Medida" value={form.unit_measure} onChange={change} obrigatorio>
                    <option value="" />
                    {units.map((u) => <option key={u.id} value={u.code}>{u.code} - {u.name}</option>)}
                </CampoSelecao>
                <CampoSelecao id="am-origem" name="source_document" label="Origem da Aquisição" value={form.source_document} onChange={change}>
                    <option value="">Não informar</option>
                    {sources.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </CampoSelecao>
                <CampoTexto id="am-obs" name="note" label="Observação" value={form.note} onChange={change} />
            </div>
            <DialogoRodape>
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="button" onClick={save}>Salvar</Button>
            </DialogoRodape>
        </Dialogo>
    );
}
