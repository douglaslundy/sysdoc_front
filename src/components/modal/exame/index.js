import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import AlertModal from '../../messagesModal';
import { showExame } from '../../../store/ducks/exames';
import { closeExameModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { addExameFetch, editExameFetch } from '../../../store/fetchActions/exames';
import { getAllCategorias } from '../../../store/fetchActions/categoriasExame';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';
import { Interruptor } from '../../ui/interruptor';

const FORM_INICIAL = { nome: '', codigo: '', categoria_exame_id: '', descricao: '', ativo: true };

export default function ExameModal(props) {
    const dispatch = useDispatch();
    const router = useRouter();
    const { exame } = useSelector(state => state.exames);
    const { isOpenExameModal } = useSelector(state => state.layout);
    const { categorias } = useSelector(state => state.categoriasExame);

    const [form, setForm] = useState(FORM_INICIAL);

    const isEdit = !!(exame && exame.id);

    const change = ({ target: { name, value } }) => setForm(f => ({ ...f, [name]: value }));

    const cleanForm = () => {
        setForm(FORM_INICIAL);
        dispatch(closeExameModal());
        dispatch(showExame({}));
    };

    const handleSave = () => {
        if (isEdit) {
            dispatch(changeTitleAlert(`Exame ${form.nome} atualizado com sucesso!`));
            dispatch(editExameFetch(exame.id, form, cleanForm));
        } else {
            dispatch(changeTitleAlert(`Exame ${form.nome} criado com sucesso!`));
            dispatch(addExameFetch(form, (saved) => {
                dispatch(closeExameModal());
                dispatch(showExame({}));
                router.push(`/laboratorio/exames/${saved.id}/campos`);
            }));
        }
    };

    useEffect(() => {
        dispatch(getAllCategorias({ all: true }));
    }, []);

    useEffect(() => {
        if (exame && exame.id) {
            setForm({
                nome:               exame.nome || '',
                codigo:             exame.codigo || '',
                categoria_exame_id: exame.categoria_exame_id || '',
                descricao:          exame.descricao || '',
                ativo:              exame.ativo ?? true,
            });
        } else {
            setForm(FORM_INICIAL);
        }
    }, [exame]);

    const categoriasAtivas = categorias.filter(c => c.ativo);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenExameModal)} aoFechar={cleanForm} tamanho="md">
                <DialogoCabecalho>{isEdit ? 'Editar Exame' : 'Cadastrar Exame'}</DialogoCabecalho>
                <AlertModal />
                <div className="grid gap-4">
                    <CampoTexto id="exame-nome" label="Nome do Exame" name="nome" value={form.nome} onChange={change} obrigatorio maxLength={100} className="uppercase" />
                    <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                        <CampoTexto id="exame-codigo" label="Código" name="codigo" value={form.codigo} onChange={change} obrigatorio maxLength={30} className="uppercase" />
                        <CampoSelecao id="exame-categoria" label="Categoria" name="categoria_exame_id" value={form.categoria_exame_id} onChange={({ target: { value } }) => setForm(f => ({ ...f, categoria_exame_id: value === '' ? '' : Number(value) }))}>
                            <option value="">Sem categoria</option>
                            {categoriasAtivas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </CampoSelecao>
                    </div>
                    <CampoTexto id="exame-descricao" label="Descrição" name="descricao" value={form.descricao} onChange={change} multiline rows={3} maxLength={500} />
                    <Interruptor id="exame-ativo" marcado={form.ativo} aoMudar={(ativo) => setForm(f => ({ ...f, ativo }))}>
                        Exame ativo
                    </Interruptor>
                </div>
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={cleanForm}>Cancelar</Button>
                    <Button type="button" onClick={handleSave}>{isEdit ? 'Salvar' : 'Criar e gerenciar campos'}</Button>
                </DialogoRodape>
            </Dialogo>
        </div>
    );
}
