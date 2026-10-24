import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showSpeciality } from '../../../store/ducks/specialities';
import { closeSpecialitiesModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editSpecialityFetch, addSpecialityFetch } from '../../../store/fetchActions/specialities';
import AlertModal from '../../messagesModal';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { Campo, Input } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';
import { Interruptor } from '../../ui/interruptor';

const FORM_VAZIO = { name: "", allows_session_scheduling: false };

export default function SpecialityModal(props) {
    const [form, setForm] = useState(FORM_VAZIO);
    const { name, allows_session_scheduling } = form;
    const { speciality } = useSelector(state => state.specialities);
    const { isOpenSpecialitiesModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();
    const [texto, setTexto] = useState();

    const changeItem = ({ target: { name, value } }) => {
        setForm(atual => ({ ...atual, [name]: value }));
    };

    const cleanForm = () => {
        setForm(FORM_VAZIO);
        setTexto('');
        dispatch(closeSpecialitiesModal());
        dispatch(showSpeciality({}));
    };

    const handleSaveData = async () => {
        speciality && speciality.id ? handlePutData() : handlePostData();
    };

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`A especialidade ${form.name} foi Cadastrado com sucesso!`));
        dispatch(addSpecialityFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`A especialidade ${form.name} foi atualizado com sucesso!`));
        dispatch(editSpecialityFetch(form, cleanForm));
    };

    useEffect(() => {
        if (speciality && speciality.id)
            setForm(speciality);
    }, [speciality]);

    const editando = Boolean(speciality && speciality.id);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenSpecialitiesModal)} aoFechar={cleanForm} tamanho="md">
                <AlertModal />
                <DialogoCabecalho>{editando ? "Editar Especialidade" : "Cadastrar Especialidade"}</DialogoCabecalho>
                {texto ? <div className="mb-4"><Banner tom="alerta">{texto}</Banner></div> : null}
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveData();
                    }}
                >
                    <Campo
                        id="especialidade-nome"
                        label="Nome da especialidade"
                        obrigatorio
                        dica={name && name.length > 0 ? `${50 - name.length} caracteres restantes` : undefined}
                    >
                        {(p) => <Input {...p} name="name" value={name || ''} onChange={changeItem} required maxLength={50} autoComplete="off" className="uppercase" />}
                    </Campo>
                    <Interruptor id="especialidade-sessoes" marcado={allows_session_scheduling} aoMudar={(v) => setForm(atual => ({ ...atual, allows_session_scheduling: v }))}>
                        Permite agendamento por sessões (ex: Fisioterapia)
                    </Interruptor>
                    <DialogoRodape>
                        <Button type="button" variant="outline" onClick={cleanForm}>Cancelar</Button>
                        <Button type="submit">Gravar</Button>
                    </DialogoRodape>
                </form>
            </Dialogo>
        </div>
    );
}
