import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { api } from '../../../services/api';
import { addMedicineFetch, editMedicineFetch } from '../../../store/fetchActions/medicines';
import { CaixaDeMarcacao } from '../../ui/caixa-de-marcacao';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';

const EMPTY = {
    internal_code: '',
    brand_name: '',
    active_ingredient: '',
    concentration: '',
    pharmaceutical_form: '',
    presentation: '',
    unit_measure: '',
    ean_code: '',
    is_free_distribution: true,
    is_controlled: false,
    is_judicial_order: false,
    is_high_cost: false,
    active: true,
    technical_notes: '',
};

export default function MedicineDialog({ open, onClose, medicine, onSuccess }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState(EMPTY);
    const [units, setUnits] = useState([]);
    const [forms, setForms] = useState([]);
    const [presentations, setPresentations] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        setForm(medicine ? {
            ...EMPTY,
            ...medicine,
        } : EMPTY);
        setErrorMessage('');
    }, [medicine?.id, open]);

    useEffect(() => {
        if (open) {
            api.get('/pharmacy/catalogs')
                .then((res) => {
                    setUnits(res.data?.units || []);
                    setForms(res.data?.pharmaceutical_forms || []);
                    setPresentations(res.data?.presentations || []);
                })
                .catch(() => setErrorMessage('Não foi possível carregar os catálogos da farmácia.'));
        }
    }, [open]);

    const change = ({ target: { name, value } }) => {
        setForm((f) => ({ ...f, [name]: value }));
        if (errorMessage) setErrorMessage('');
    };

    const save = () => {
        if (medicine?.id) {
            dispatch(editMedicineFetch(medicine.id, form, onSuccess, setErrorMessage));
            return;
        }
        dispatch(addMedicineFetch(form, onSuccess, setErrorMessage));
    };

    const campo = (name, label, extra = {}) => (
        <CampoTexto id={`med-${name}`} name={name} label={label} value={form[name] || ''} onChange={change} {...extra} />
    );
    const selecao = (name, label, opcoes) => (
        <CampoSelecao id={`med-${name}`} name={name} label={label} value={form[name] || ''} onChange={change} obrigatorio>
            <option value="" />
            {opcoes}
        </CampoSelecao>
    );
    const marca = (name, label) => (
        <CaixaDeMarcacao id={`med-${name}`} marcado={!!form[name]} aoMudar={(v) => { setForm((f) => ({ ...f, [name]: v })); if (errorMessage) setErrorMessage(''); }}>
            {label}
        </CaixaDeMarcacao>
    );

    return (
        <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="md">
            <DialogoCabecalho>{medicine?.id ? 'Editar Medicamento' : 'Novo Medicamento'}</DialogoCabecalho>
            <div className="grid gap-4">
                {errorMessage ? <Banner tom="perigo">{errorMessage}</Banner> : null}
                {campo('internal_code', 'Código Interno', { obrigatorio: true })}
                {campo('brand_name', 'Nome Comercial')}
                {campo('active_ingredient', 'Princípio Ativo', { obrigatorio: true })}
                {campo('concentration', 'Concentração', { obrigatorio: true })}
                {selecao('pharmaceutical_form', 'Forma Farmacêutica', forms.map((f) => <option key={f.id} value={f.name}>{f.name}</option>))}
                {selecao('presentation', 'Apresentação', presentations.map((p) => <option key={p.id} value={p.name}>{p.name}</option>))}
                {selecao('unit_measure', 'Unidade de Medida', units.map((u) => <option key={u.id} value={u.code}>{u.code} - {u.name}</option>))}
                {campo('ean_code', 'Código EAN')}
                {campo('technical_notes', 'Observações Técnicas')}
                {marca('is_free_distribution', 'Distribuição Gratuita')}
                {marca('is_controlled', 'Medicamento Controlado')}
                {marca('is_judicial_order', 'Ordem Judicial')}
                {marca('is_high_cost', 'Alto Custo')}
                {marca('active', 'Ativo')}
            </div>
            <DialogoRodape>
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="button" onClick={save}>Salvar</Button>
            </DialogoRodape>
        </Dialogo>
    );
}
