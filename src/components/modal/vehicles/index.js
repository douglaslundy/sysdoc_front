import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { showVehicle } from '../../../store/ducks/vehicles';
import { closeVehiclesModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editVehicleFetch, addVehicleFetch } from '../../../store/fetchActions/vehicles';
import AlertModal from '../../messagesModal';
import { FormularioModal } from '../../ui/formulario-modal';
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from '../../secretaria/CampoSecretariaObrigatorio';

const FORM_VAZIO = {
    brand: "",
    model: "",
    color: "",
    license_plate: "",
    renavan: "",
    chassis: "",
    capacity: "",
    year: ""
};

const CAMPOS = [
    { name: 'brand', label: 'Marca', max: 20, required: true, upper: true, span: 3 },
    { name: 'model', label: 'Modelo', max: 20, required: true, upper: true, span: 3 },
    { name: 'color', label: 'Cor', max: 10, required: true, upper: true, span: 3 },
    { name: 'year', label: 'Ano', type: 'number', required: true, span: 3 },
    { name: 'license_plate', label: 'Placa', max: 7, required: true, upper: true, span: 3 },
    { name: 'renavan', label: 'Renavan', max: 11, required: true, upper: true, span: 3 },
    { name: 'chassis', label: 'Chassi', max: 17, required: true, upper: true, span: 4 },
    { name: 'capacity', label: 'Capacidade', type: 'number', required: true, span: 2 },
];

export default function VehicleModal(props) {
    const [form, setForm] = useState(FORM_VAZIO);
    const { vehicle } = useSelector(state => state.vehicles);
    const { isOpenVehiclesModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();
    const secretaria = useSecretariaObrigatoria();

    const changeItem = ({ target: { name, value } }) => {
        setForm(atual => ({ ...atual, [name]: value }));
    };

    const cleanForm = () => {
        setForm(FORM_VAZIO);
        secretaria.limpar();
        dispatch(closeVehiclesModal());
        dispatch(showVehicle({}));
    };

    const handleSaveData = async () => {
        vehicle && vehicle.id ? handlePutData() : handlePostData();
    };

    const handlePostData = async () => {
        if (!secretaria.validar()) return;
        dispatch(changeTitleAlert(`O Veículo ${form.model.toUpperCase()} ${form.brand.toUpperCase()} PLACA ${form.license_plate.toUpperCase()} foi cadastrado com sucesso!`));
        dispatch(addVehicleFetch({ ...form, ...secretaria.payload() }, cleanForm, secretaria.tratarErro));
    };

    const handlePutData = async () => {
        dispatch(changeTitleAlert(`O Veículo ${form.model.toUpperCase()} ${form.brand.toUpperCase()} PLACA ${form.license_plate.toUpperCase()} foi atualizado com sucesso!`));
        dispatch(editVehicleFetch(form, cleanForm));
    };

    useEffect(() => {
        if (vehicle && vehicle.id)
            setForm(vehicle);
    }, [vehicle]);

    return (
        <div>
            {props.children}
            <FormularioModal
                aberto={isOpenVehiclesModal}
                titulo={vehicle && vehicle.id ? "Editar Veículo" : "Cadastrar Veículo"}
                aoFechar={cleanForm}
                aoGravar={handleSaveData}
                campos={CAMPOS}
                valores={form}
                aoMudar={changeItem}
                antes={<><AlertModal />{!(vehicle && vehicle.id) && <CampoSecretariaObrigatorio controle={secretaria} id="veiculo-secretaria" />}</>}
            />
        </div>
    );
}
