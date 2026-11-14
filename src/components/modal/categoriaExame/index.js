import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AlertModal from '../../messagesModal';
import { showCategoria } from '../../../store/ducks/categoriasExame';
import { closeCategoriaExameModal } from '../../../store/ducks/Layout';
import { addCategoriaFetch, editCategoriaFetch } from '../../../store/fetchActions/categoriasExame';
import { Button } from '../../ui/button';
import { CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';
import { Interruptor } from '../../ui/interruptor';
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from '../../secretaria/CampoSecretariaObrigatorio';

const FORM_INICIAL = { nome: '', ativo: true };

export default function CategoriaExameModal(props) {
    const dispatch = useDispatch();
    const { categoria } = useSelector(state => state.categoriasExame);
    const { isOpenCategoriaExameModal } = useSelector(state => state.layout);

    const [form, setForm] = useState(FORM_INICIAL);
    const secretaria = useSecretariaObrigatoria();

    const isEdit = !!(categoria && categoria.id);

    const cleanForm = () => {
        setForm(FORM_INICIAL);
        secretaria.limpar();
        dispatch(closeCategoriaExameModal());
        dispatch(showCategoria({}));
    };

    const handleSave = () => {
        if (isEdit) {
            dispatch(editCategoriaFetch(categoria.id, form, cleanForm));
        } else {
            if (!secretaria.validar()) return;
            dispatch(addCategoriaFetch({ ...form, ...secretaria.payload() }, cleanForm, secretaria.tratarErro));
        }
    };

    useEffect(() => {
        if (categoria && categoria.id) {
            setForm({ nome: categoria.nome || '', ativo: categoria.ativo ?? true });
        } else {
            setForm(FORM_INICIAL);
        }
    }, [categoria]);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenCategoriaExameModal)} aoFechar={cleanForm} tamanho="md">
                <DialogoCabecalho>{isEdit ? 'Editar Categoria' : 'Cadastrar Categoria de Exame'}</DialogoCabecalho>
                <AlertModal />
                <div className="grid gap-4">
                    {!isEdit && <CampoSecretariaObrigatorio controle={secretaria} id="categoria-secretaria" />}
                    <CampoTexto
                        id="categoria-nome"
                        label="Nome da Categoria"
                        name="nome"
                        value={form.nome}
                        onChange={({ target: { value } }) => setForm(f => ({ ...f, nome: value }))}
                        obrigatorio
                        maxLength={80}
                        autoComplete="off"
                        className="uppercase"
                    />
                    <Interruptor id="categoria-ativa" marcado={form.ativo} aoMudar={(ativo) => setForm(f => ({ ...f, ativo }))}>
                        Categoria ativa
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
