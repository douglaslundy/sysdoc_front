import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { registerMedicinePublicationFetch } from '../../../store/fetchActions/medicinePublications';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';

const EMPTY = {
    reference_type: 'daily',
    reference_id: '',
    channel: 'site',
    status: 'published',
    published_at: '',
};

export default function MedicinePublicationDialog({ open, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState(EMPTY);

    const change = ({ target: { name, value } }) => setForm(f => ({ ...f, [name]: value }));
    const save = () => {
        dispatch(registerMedicinePublicationFetch({
            ...form,
            reference_id: Number(form.reference_id),
            published_at: form.published_at || null,
        }, onSuccess));
    };

    return (
        <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="md">
            <DialogoCabecalho>Register Publication Evidence</DialogoCabecalho>
            <div className="grid gap-4">
                <CampoSelecao id="pub-tipo" label="Reference Type" name="reference_type" value={form.reference_type} onChange={change}>
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                </CampoSelecao>
                <CampoTexto id="pub-ref" name="reference_id" label="Reference ID" value={form.reference_id} onChange={change} obrigatorio />
                <CampoSelecao id="pub-canal" label="Channel" name="channel" value={form.channel} onChange={change}>
                    <option value="site">Site</option>
                    <option value="panel">Panel</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="other">Other</option>
                </CampoSelecao>
                <CampoSelecao id="pub-status" label="Status" name="status" value={form.status} onChange={change}>
                    <option value="published">Published</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </CampoSelecao>
                <CampoTexto id="pub-data" name="published_at" type="datetime-local" label="Published At" value={form.published_at} onChange={change} />
            </div>
            <DialogoRodape>
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="button" onClick={save}>Save</Button>
            </DialogoRodape>
        </Dialogo>
    );
}
