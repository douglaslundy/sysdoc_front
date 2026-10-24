import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { showRoute } from '../../../store/ducks/routes';
import { closeRoutesModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editRouteFetch, addRouteFetch } from '../../../store/fetchActions/routes';
import { getAllStates } from '../../../store/fetchActions/states';
import AlertModal from '../../messagesModal';
import { FormularioModal } from '../../ui/formulario-modal';

const FORM_VAZIO = {
    origin: "",
    origin_state: "",
    destination: "",
    destination_state: "",
    distance: ""
};

export default function RouteModal(props) {
    const [form, setForm] = useState(FORM_VAZIO);
    const { states } = useSelector(state => state.states);
    const { route } = useSelector(state => state.routes);
    const { isOpenRoutesModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const changeItem = ({ target: { name, value } }) => {
        setForm(atual => ({ ...atual, [name]: value }));
    };

    const cleanForm = () => {
        setForm(FORM_VAZIO);
        dispatch(closeRoutesModal());
        dispatch(showRoute({}));
    };

    const handleSaveData = async () => {
        route && route.id ? handlePutData() : handlePostData();
    };

    const handlePostData = async () => {
        dispatch(changeTitleAlert(`A Rota ${form.origin.toUpperCase()} X ${form.destination.toUpperCase()} foi Cadastrado com sucesso!`));
        dispatch(addRouteFetch(form, cleanForm));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`A Rota ${form.origin.toUpperCase()} X ${form.destination.toUpperCase()} foi Atualizado com sucesso!`));
        dispatch(editRouteFetch(form, cleanForm));
    };

    useEffect(() => {
        if (route && route.id)
            setForm(route);
    }, [route]);

    useEffect(() => {
        dispatch(getAllStates());
    }, []);

    const opcoesDeEstado = useMemo(
        () => [...(states || [])].sort((a, b) => String(a.name).localeCompare(String(b.name))).map((s) => ({ value: s.id, label: String(s.name).toUpperCase() })),
        [states],
    );

    const campos = useMemo(() => [
        { name: 'origin', label: 'Origem', max: 50, required: true, upper: true, span: 9 },
        { name: 'origin_state', label: 'Estado de Origem', options: opcoesDeEstado, required: true, span: 3 },
        { name: 'destination', label: 'Destino', max: 50, required: true, upper: true, span: 9 },
        { name: 'destination_state', label: 'Estado do Destino', options: opcoesDeEstado, required: true, span: 3 },
        { name: 'distance', label: 'Distância', type: 'number', required: true },
    ], [opcoesDeEstado]);

    return (
        <div>
            {props.children}
            <FormularioModal
                aberto={isOpenRoutesModal}
                titulo={route && route.id ? "Editar Rota" : "Cadastrar Rota"}
                aoFechar={cleanForm}
                aoGravar={handleSaveData}
                campos={campos}
                valores={form}
                aoMudar={changeItem}
                tamanho="md"
                antes={<AlertModal />}
            />
        </div>
    );
}
