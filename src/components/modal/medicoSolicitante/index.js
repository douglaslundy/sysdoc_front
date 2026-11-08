import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AlertModal from '../../messagesModal';
import { showMedico } from '../../../store/ducks/medicosSolicitantes';
import { closeMedicoSolicitanteModal } from '../../../store/ducks/Layout';
import { addMedicoFetch, editMedicoFetch } from '../../../store/fetchActions/medicosSolicitantes';
import { Button } from '../../ui/button';
import { CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';
import { Interruptor } from '../../ui/interruptor';
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from '../../secretaria/CampoSecretariaObrigatorio';

const FORM_INICIAL = { nome: '', crm: '', uf_crm: '', especialidade: '', telefone: '', ativo: true };

export default function MedicoSolicitanteModal(props) {
    const dispatch = useDispatch();
    const { medico } = useSelector(state => state.medicosSolicitantes);
    const { isOpenMedicoSolicitanteModal } = useSelector(state => state.layout);

    const [form, setForm] = useState(FORM_INICIAL);
    const secretaria = useSecretariaObrigatoria();

    const isEdit = !!(medico && medico.id);

    const cleanForm = () => {
        setForm(FORM_INICIAL);
        secretaria.limpar();
        dispatch(closeMedicoSolicitanteModal());
        dispatch(showMedico({}));
    };

    const handleChange = ({ target: { name, value } }) => setForm(f => ({ ...f, [name]: value }));

    const handleSave = () => {
        if (isEdit) {
            dispatch(editMedicoFetch(medico.id, form, cleanForm));
        } else {
            if (!secretaria.validar()) return;
            dispatch(addMedicoFetch({ ...form, ...secretaria.payload() }, cleanForm, secretaria.tratarErro));
        }
    };

    useEffect(() => {
        if (medico && medico.id) {
            setForm({
                nome: medico.nome || '',
                crm: medico.crm || '',
                uf_crm: medico.uf_crm || '',
                especialidade: medico.especialidade || '',
                telefone: medico.telefone || '',
                ativo: medico.ativo ?? true,
            });
        } else {
            setForm(FORM_INICIAL);
        }
    }, [medico]);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenMedicoSolicitanteModal)} aoFechar={cleanForm} tamanho="md">
                <DialogoCabecalho>{isEdit ? 'Editar Médico Solicitante' : 'Cadastrar Médico Solicitante'}</DialogoCabecalho>
                <AlertModal />
                <div className="grid gap-4">
                    {!isEdit && <CampoSecretariaObrigatorio controle={secretaria} id="medico-secretaria" />}
                    <CampoTexto id="medico-nome" label="Nome completo" name="nome" value={form.nome} onChange={handleChange} obrigatorio maxLength={100} autoComplete="off" />
                    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                        <CampoTexto id="medico-crm" label="CRM" name="crm" value={form.crm} onChange={handleChange} maxLength={20} autoComplete="off" />
                        <CampoTexto id="medico-uf" label="UF" name="uf_crm" value={form.uf_crm} onChange={({ target: { value } }) => setForm(f => ({ ...f, uf_crm: value.toUpperCase().slice(0, 2) }))} maxLength={2} autoComplete="off" />
                    </div>
                    <CampoTexto id="medico-especialidade" label="Especialidade" name="especialidade" value={form.especialidade} onChange={handleChange} maxLength={80} autoComplete="off" />
                    <CampoTexto id="medico-telefone" label="Telefone" name="telefone" value={form.telefone} onChange={handleChange} maxLength={20} autoComplete="off" />
                    <Interruptor id="medico-ativo" marcado={form.ativo} aoMudar={(ativo) => setForm(f => ({ ...f, ativo }))}>
                        Médico ativo
                    </Interruptor>
                </div>
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={cleanForm}>Cancelar</Button>
                    <Button type="button" onClick={handleSave}>Gravar</Button>
                </DialogoRodape>
            </Dialogo>
        </div>
    );
}
